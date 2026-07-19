import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  inventoryItems,
  orderItems,
  orders,
  payments,
  productVariants,
  products,
  webhookEvents,
} from "@/db/schema";
import { decryptSecret, encryptSecret, randomToken, safeSecretEqual, sha256 } from "@/lib/crypto";
import { escapeEmailHtml, sendTransactionalEmail } from "@/lib/email";
import { checkPaymentStatus, createPayment, normalizeProviderStatus, paymentExpiryMilliseconds } from "@/lib/payment-provider";

type CheckoutInput = { checkoutKey: string; browserKey: string; variantId: string; buyerName: string; buyerWhatsapp: string; buyerEmail?: string; origin: string };
type DeliveryEntry = { label: string; value: string; kind: "url" | "code" };
type CustomerItem = { item: typeof orderItems.$inferSelect; variant: typeof productVariants.$inferSelect | null };

const ORDER_PREFIX = "FGS";

export class ActiveCheckoutError extends Error {
  constructor(public readonly publicToken: string) {
    super("Masih ada pembayaran yang menunggu. Selesaikan atau tunggu tagihan sebelumnya berakhir terlebih dahulu.");
  }
}

export class CancellationLimitError extends Error {
  constructor() {
    super("Batas pembatalan pembayaran untuk browser ini sudah tercapai. Tunggu tagihan aktif berakhir otomatis.");
  }
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${ORDER_PREFIX}-${date}-${randomToken(5).toUpperCase()}`;
}

export function normalizeWhatsapp(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const normalized = cleaned.startsWith("0") ? `62${cleaned.slice(1)}` : cleaned;
  if (!/^62\d{8,15}$/.test(normalized)) throw new Error("Nomor WhatsApp tidak valid. Gunakan format 08xx atau 62xx.");
  return normalized;
}

function waLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function asSnapshot(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function deliveryKind(value: string): DeliveryEntry["kind"] {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? "url" : "code";
  } catch {
    return "code";
  }
}

function stablePayload(payload: Record<string, unknown>) {
  return JSON.stringify(Object.keys(payload).sort().reduce<Record<string, unknown>>((result, key) => {
    result[key] = payload[key];
    return result;
  }, {}));
}

function callbackAmount(payload: Record<string, unknown>) {
  const raw = payload.total_amount ?? payload.amount_total ?? payload.paid_amount;
  if (raw === undefined || raw === null || raw === "") return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

function paymentCallbackBaseUrl(origin: string) {
  const configured = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || origin;
  const url = new URL(configured);
  if (url.hostname === "klikqris.com" || url.hostname.endsWith(".klikqris.com")) {
    throw new Error("PUBLIC_BASE_URL harus berisi URL publik FG Store, bukan URL API KlikQRIS.");
  }
  return url.toString().replace(/\/$/, "");
}

export async function createCheckout(input: CheckoutInput) {
  if (!db) throw new Error("Store database is not configured.");
  const existing = await findCheckoutByKey(input.checkoutKey);
  if (existing) return { publicToken: existing.publicToken, orderNumber: existing.orderNumber, reused: true };
  const result = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, input.variantId))
    .limit(1);
  const record = result[0];
  if (!record || record.product.publicationStatus !== "PUBLISHED" || record.variant.status !== "ACTIVE") throw new Error("Produk ini tidak tersedia.");
  if (record.product.availabilityMode === "FORCE_SOLD_OUT") throw new Error("Produk ini sedang sold out.");
  if (record.variant.fulfillmentMode === "SINGLE_SHARED" && !record.variant.sharedDeliveryValue) throw new Error("Produk belum dikonfigurasi untuk pengiriman otomatis.");
  if (record.variant.fulfillmentMode !== "MANUAL_WHATSAPP" && !input.buyerEmail?.trim()) throw new Error("Email wajib diisi untuk menerima akses digital otomatis.");

  const publicToken = randomToken(24);
  const number = orderNumber();
  const expiresAt = new Date(Date.now() + paymentExpiryMilliseconds());
  const buyerWhatsapp = normalizeWhatsapp(input.buyerWhatsapp);
  let orderId = "";
  let reserved = false;

  await db.transaction(async (tx) => {
    // Serialize checkout creation for a browser key. This guards the small
    // window where two tabs submit different idempotency keys at once.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.browserKey}))`);
    const active = await tx.query.orders.findFirst({
      where: and(
        eq(orders.browserKey, input.browserKey),
        eq(orders.status, "AWAITING_PAYMENT"),
        gt(orders.expiresAt, new Date()),
      ),
      orderBy: [desc(orders.createdAt)],
    });
    if (active) throw new ActiveCheckoutError(active.publicToken);
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: number,
        publicToken,
        checkoutKey: input.checkoutKey,
        browserKey: input.browserKey,
        buyerName: input.buyerName.trim(),
        buyerWhatsapp,
        buyerEmail: input.buyerEmail?.trim().toLowerCase() || null,
        subtotal: record.variant.price,
        totalAmount: record.variant.price,
        expiresAt,
      })
      .returning({ id: orders.id });
    orderId = order.id;
    const deliverySnapshot = record.variant.fulfillmentMode === "SINGLE_SHARED" ? {
      deliverySecret: record.variant.sharedDeliveryValue,
      deliveryLabel: record.variant.sharedDeliveryLabel || "Akses digital",
    } : {};
    await tx.insert(orderItems).values({
      orderId,
      variantId: record.variant.id,
      productName: record.product.name,
      variantName: record.variant.name,
      sku: record.variant.sku,
      price: record.variant.price,
      quantity: 1,
      fulfillmentMode: record.variant.fulfillmentMode,
      snapshot: {
        duration: record.variant.duration,
        warranty: record.variant.warranty,
        channel: record.variant.channel,
        estimatedProcess: record.variant.estimatedProcess,
        ...deliverySnapshot,
      },
    });
    if (record.variant.fulfillmentMode === "UNIQUE_POOL") {
      await tx.update(inventoryItems).set({ status: "AVAILABLE", reservedOrderId: null, reservedUntil: null, updatedAt: new Date() }).where(and(eq(inventoryItems.variantId, record.variant.id), eq(inventoryItems.status, "RESERVED"), lt(inventoryItems.reservedUntil, new Date())));
      const candidates = await tx.execute(sql`
        select id from inventory_items
        where variant_id = ${record.variant.id}::uuid and status = 'AVAILABLE'
        order by created_at asc
        for update skip locked
        limit 1
      `);
      const inventoryId = candidates[0]?.id as string | undefined;
      if (!inventoryId) throw new Error("Stok produk sudah habis.");
      await tx.update(inventoryItems).set({ status: "RESERVED", reservedOrderId: orderId, reservedUntil: expiresAt, updatedAt: new Date() }).where(eq(inventoryItems.id, inventoryId));
      reserved = true;
    }
  }).catch(async (error: unknown) => {
    if (isUniqueViolation(error)) {
      const duplicate = await findCheckoutByKey(input.checkoutKey);
      if (duplicate) {
        orderId = duplicate.id;
        return;
      }
    }
    throw error;
  });

  if (!orderId) throw new Error("Checkout gagal dibuat.");
  const duplicate = await findCheckoutByKey(input.checkoutKey);
  if (duplicate && duplicate.orderNumber !== number) {
    return { publicToken: duplicate.publicToken, orderNumber: duplicate.orderNumber, reused: true };
  }

  try {
    const payment = await createPayment({
      orderNumber: number,
      amount: record.variant.price,
      description: `${record.product.name} — ${record.variant.name}`,
      callbackUrl: `${paymentCallbackBaseUrl(input.origin)}/api/webhooks/klikqris`,
    });
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ totalAmount: payment.totalAmount, expiresAt: payment.expiresAt, updatedAt: new Date() }).where(eq(orders.id, orderId));
      if (reserved) await tx.update(inventoryItems).set({ reservedUntil: payment.expiresAt, updatedAt: new Date() }).where(eq(inventoryItems.reservedOrderId, orderId));
      await tx.insert(payments).values({
        orderId,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        signature: payment.signature || null,
        qrImage: payment.qrImage,
        qrUrl: payment.qrUrl,
        requestedAmount: payment.requestedAmount,
        uniqueAmount: payment.uniqueAmount,
        totalAmount: payment.totalAmount,
        rawResponse: { create: payment.raw },
      });
    });
  } catch (error) {
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(orders.id, orderId));
      if (reserved) await tx.update(inventoryItems).set({ status: "AVAILABLE", reservedOrderId: null, reservedUntil: null, updatedAt: new Date() }).where(eq(inventoryItems.reservedOrderId, orderId));
    });
    throw error;
  }
  return { publicToken, orderNumber: number, reused: false };
}

export async function getActiveCheckoutForBrowser(browserKey: string) {
  if (!db) return null;
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.browserKey, browserKey),
      eq(orders.status, "AWAITING_PAYMENT"),
      gt(orders.expiresAt, new Date()),
    ),
    orderBy: [desc(orders.createdAt)],
  });
  if (!order) return null;
  const [item, cancelled] = await Promise.all([
    db.query.orderItems.findFirst({ where: eq(orderItems.orderId, order.id) }),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(and(
      eq(orders.browserKey, browserKey),
      sql`${orders.customerCancelledAt} is not null`,
    )),
  ]);
  return {
    token: order.publicToken,
    number: order.orderNumber,
    expiresAt: order.expiresAt,
    productName: item?.productName || "Produk digital",
    variantName: item?.variantName || "",
    cancellationsRemaining: Math.max(0, 3 - (cancelled[0]?.count || 0)),
  };
}

export async function cancelCheckoutForBrowser(publicToken: string, browserKey: string) {
  if (!db) throw new Error("Store database is not configured.");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${browserKey}))`);
    const order = await tx.query.orders.findFirst({ where: and(eq(orders.publicToken, publicToken), eq(orders.browserKey, browserKey)) });
    if (!order) throw new Error("Sesi pembayaran tidak ditemukan di browser ini.");
    if (order.status !== "AWAITING_PAYMENT" || order.expiresAt <= new Date()) throw new Error("Tagihan ini sudah tidak dapat dibatalkan.");
    const [countRow] = await tx.select({ count: sql<number>`count(*)::int` }).from(orders).where(and(
      eq(orders.browserKey, browserKey),
      sql`${orders.customerCancelledAt} is not null`,
    ));
    if ((countRow?.count || 0) >= 3) throw new CancellationLimitError();
    const [updated] = await tx.update(orders).set({
      status: "CANCELLED",
      customerCancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(orders.id, order.id), eq(orders.status, "AWAITING_PAYMENT"))).returning({ id: orders.id });
    if (!updated) throw new Error("Status tagihan sudah berubah. Muat ulang halaman untuk melihat status terbaru.");
    await tx.update(inventoryItems).set({ status: "AVAILABLE", reservedOrderId: null, reservedUntil: null, updatedAt: new Date() }).where(and(
      eq(inventoryItems.reservedOrderId, order.id),
      eq(inventoryItems.status, "RESERVED"),
    ));
    return { cancelled: true, cancellationsRemaining: Math.max(0, 2 - (countRow?.count || 0)) };
  });
}

function isUniqueViolation(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

export async function findCheckoutByKey(checkoutKey: string) {
  if (!db) throw new Error("Store database is not configured.");
  const order = await db.query.orders.findFirst({ where: eq(orders.checkoutKey, checkoutKey) });
  return order ? { id: order.id, publicToken: order.publicToken, orderNumber: order.orderNumber } : null;
}

export async function markPaymentFromCallback(payload: Record<string, unknown>) {
  if (!db) throw new Error("Store database is not configured.");
  const providerOrderId = String(payload.order_id ?? payload.orderId ?? payload.reference ?? "");
  const callbackSignature = String(payload.signature ?? payload.callback_signature ?? "");
  if (!providerOrderId) throw new Error("Missing payment order reference.");
  const payment = await db.query.payments.findFirst({ where: eq(payments.providerOrderId, providerOrderId) });
  if (!payment) throw new Error("Unknown payment reference.");
  if (payment.provider === "klikqris" && (!payment.signature || !safeSecretEqual(callbackSignature, payment.signature))) throw new Error("Invalid payment callback signature.");
  const configuredMerchant = process.env.KLIKQRIS_MERCHANT_ID?.trim();
  const callbackMerchant = String(payload.id_merchant ?? payload.merchant_id ?? "").trim();
  if (configuredMerchant && callbackMerchant && !safeSecretEqual(configuredMerchant, callbackMerchant)) throw new Error("Invalid payment merchant.");

  const status = normalizeProviderStatus(payload);
  const eventHash = await sha256(`${payment.provider}:${providerOrderId}:${status}:${stablePayload(payload)}`);
  const existingEvent = await db.query.webhookEvents.findFirst({ where: eq(webhookEvents.eventHash, eventHash) });
  if (existingEvent?.processedAt) return { paid: payment.status === "PAID", orderId: payment.orderId, duplicate: true };
  if (!existingEvent) await db.insert(webhookEvents).values({ provider: payment.provider, eventHash, orderId: payment.orderId, verified: true, payload }).onConflictDoNothing();

  try {
    const receivedAmount = callbackAmount(payload);
    if (status === "PAID" && payment.provider === "klikqris" && receivedAmount === null) {
      throw new Error("Missing payment callback total_amount.");
    }
    if (status === "PAID" && receivedAmount !== null && receivedAmount !== payment.totalAmount) {
      const mismatchApplied = await db.transaction(async (tx) => {
        const [updated] = await tx.update(payments).set({ providerStatus: "AMOUNT_MISMATCH", status: "AMOUNT_MISMATCH", rawResponse: { ...(payment.rawResponse as object), callback: payload }, updatedAt: new Date() }).where(and(eq(payments.id, payment.id), eq(payments.status, "PENDING"))).returning({ id: payments.id });
        if (updated) await tx.update(orders).set({ status: "MANUAL_REVIEW", updatedAt: new Date() }).where(and(eq(orders.id, payment.orderId), eq(orders.status, "AWAITING_PAYMENT")));
        await tx.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.eventHash, eventHash));
        return Boolean(updated);
      });
      if (!mismatchApplied) {
        const current = await db.query.payments.findFirst({ where: eq(payments.id, payment.id) });
        return { paid: current?.status === "PAID", orderId: payment.orderId, amountMismatchIgnored: true };
      }
      return { paid: false, orderId: payment.orderId, amountMismatch: true };
    }

    if (status === "PAID") {
      await fulfillPaidOrder(payment.orderId, payment.id, payload);
    } else {
      await db.transaction(async (tx) => {
        const nextPayment = status === "EXPIRED" ? "EXPIRED" : status === "FAILED" ? "FAILED" : "PENDING";
        const [updated] = await tx.update(payments).set({ providerStatus: nextPayment, status: nextPayment, rawResponse: { ...(payment.rawResponse as object), callback: payload }, updatedAt: new Date() }).where(and(eq(payments.id, payment.id), eq(payments.status, "PENDING"))).returning({ id: payments.id });
        if (updated && ["EXPIRED", "FAILED"].includes(nextPayment)) {
          await tx.update(orders).set({ status: nextPayment === "EXPIRED" ? "EXPIRED" : "CANCELLED", updatedAt: new Date() }).where(and(eq(orders.id, payment.orderId), eq(orders.status, "AWAITING_PAYMENT")));
          await tx.update(inventoryItems).set({ status: "AVAILABLE", reservedOrderId: null, reservedUntil: null, updatedAt: new Date() }).where(and(eq(inventoryItems.reservedOrderId, payment.orderId), eq(inventoryItems.status, "RESERVED")));
        }
        await tx.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.eventHash, eventHash));
      });
    }
    await db.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.eventHash, eventHash));
    return { paid: status === "PAID", orderId: payment.orderId };
  } catch (error) {
    await db.update(webhookEvents).set({ error: error instanceof Error ? error.message.slice(0, 500) : "Callback processing failed" }).where(eq(webhookEvents.eventHash, eventHash));
    throw error;
  }
}

export async function reconcilePendingOrderPayment(publicToken: string) {
  if (!db || process.env.PAYMENT_PROVIDER !== "klikqris") return null;
  const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, publicToken) });
  if (!order) return null;
  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, order.id) });
  if (!payment || payment.provider !== "klikqris" || payment.status !== "PENDING") return null;

  // Customer pages poll every five seconds. Limit provider reconciliation to
  // one request per 30 seconds; the webhook remains the primary signal.
  if (Date.now() - payment.updatedAt.getTime() < 30_000) return null;
  try {
    const providerData = await checkPaymentStatus(payment.providerOrderId);
    return await markPaymentFromCallback(providerData);
  } catch (error) {
    console.error("KlikQRIS status reconciliation failed", error);
    return null;
  }
}

export async function fulfillPaidOrder(orderId: string, paymentId?: string, rawPayload?: Record<string, unknown>) {
  if (!db) throw new Error("Store database is not configured.");
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from orders where id = ${orderId}::uuid for update`);
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) throw new Error("Order not found.");
    if (paymentId) {
      const currentPayment = await tx.query.payments.findFirst({ where: eq(payments.id, paymentId) });
      await tx.update(payments).set({
        status: "PAID",
        providerStatus: "PAID",
        rawResponse: { ...((currentPayment?.rawResponse as object) || {}), callback: rawPayload || {} },
        updatedAt: new Date(),
      }).where(eq(payments.id, paymentId));
    }
    if (["PAID", "FULFILLED", "FULFILLING", "MANUAL_REVIEW"].includes(order.status)) return { transitioned: false, status: order.status };
    // A valid late callback can arrive after the QR was marked expired or a
    // transient provider failure. Payment remains the source of truth: try to
    // allocate stock again, and fall back to MANUAL_REVIEW when it is gone.
    if (!["AWAITING_PAYMENT", "EXPIRED", "CANCELLED"].includes(order.status)) {
      throw new Error("Order cannot be fulfilled from its current status.");
    }

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const hasManual = items.some((item) => item.fulfillmentMode === "MANUAL_WHATSAPP");
    let uniqueAllocationMissing = false;
    for (const item of items.filter((candidate) => candidate.fulfillmentMode === "UNIQUE_POOL")) {
      let [delivered] = await tx.update(inventoryItems).set({ status: "DELIVERED", deliveredOrderId: orderId, deliveredAt: new Date(), updatedAt: new Date() }).where(and(eq(inventoryItems.reservedOrderId, orderId), eq(inventoryItems.variantId, item.variantId!), eq(inventoryItems.status, "RESERVED"))).returning({ id: inventoryItems.id });
      if (!delivered) {
        const candidates = await tx.execute(sql`
          select id from inventory_items
          where variant_id = ${item.variantId}::uuid and status = 'AVAILABLE'
          order by created_at asc
          for update skip locked
          limit 1
        `);
        const replacementId = candidates[0]?.id as string | undefined;
        if (replacementId) [delivered] = await tx.update(inventoryItems).set({ status: "DELIVERED", reservedOrderId: orderId, reservedUntil: null, deliveredOrderId: orderId, deliveredAt: new Date(), updatedAt: new Date() }).where(and(eq(inventoryItems.id, replacementId), eq(inventoryItems.status, "AVAILABLE"))).returning({ id: inventoryItems.id });
      }
      if (!delivered) uniqueAllocationMissing = true;
    }

    const nextStatus = uniqueAllocationMissing ? "MANUAL_REVIEW" : hasManual ? "PAID" : "FULFILLED";
    const emailStatus = uniqueAllocationMissing ? "NOT_REQUESTED" : order.buyerEmail ? "PENDING" : "SKIPPED";
    await tx.update(orders).set({
      status: nextStatus,
      paidAt: new Date(),
      fulfilledAt: nextStatus === "FULFILLED" ? new Date() : null,
      deliveryEmailStatus: emailStatus,
      deliveryEmailLastError: uniqueAllocationMissing ? "Akses unik belum tersedia; pesanan menunggu review admin." : order.buyerEmail ? null : "Pembeli tidak mengisi email.",
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));
    return { transitioned: true, status: nextStatus };
  });

  return outcome;
}

export async function markMockPayment(publicToken: string) {
  if (!db) throw new Error("Store database is not configured.");
  if (process.env.PAYMENT_PROVIDER === "klikqris" || (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAY !== "true")) throw new Error("Mock payment is unavailable.");
  const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, publicToken) });
  if (!order) throw new Error("Order not found.");
  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, order.id) });
  if (!payment) throw new Error("Payment not found.");
  await fulfillPaidOrder(order.id, payment.id, { status: "PAID", order_id: payment.providerOrderId, signature: payment.signature });
  return { orderId: order.id };
}

async function getDeliveryEntries(orderId: string, items: CustomerItem[]): Promise<DeliveryEntry[]> {
  if (!db) return [];
  const delivered: DeliveryEntry[] = [];
  for (const row of items) {
    if (row.item.fulfillmentMode === "SINGLE_SHARED") {
      const snapshot = asSnapshot(row.item.snapshot);
      const encrypted = typeof snapshot.deliverySecret === "string" ? snapshot.deliverySecret : row.variant?.sharedDeliveryValue;
      if (encrypted) {
        const value = decryptSecret(encrypted);
        delivered.push({ label: typeof snapshot.deliveryLabel === "string" ? snapshot.deliveryLabel : row.variant?.sharedDeliveryLabel || "Akses digital", value, kind: deliveryKind(value) });
      }
    }
    if (row.item.fulfillmentMode === "UNIQUE_POOL" && row.item.variantId) {
      const inventory = await db.query.inventoryItems.findFirst({ where: and(eq(inventoryItems.deliveredOrderId, orderId), eq(inventoryItems.variantId, row.item.variantId)) });
      if (inventory) {
        const value = decryptSecret(inventory.encryptedValue);
        delivered.push({ label: "Akses unik", value, kind: deliveryKind(value) });
      }
    }
  }
  return delivered;
}

export async function getOrderForCustomer(publicToken: string, browserKey?: string) {
  if (!db) return null;
  let order = await db.query.orders.findFirst({ where: eq(orders.publicToken, publicToken) });
  if (!order) return null;
  // An older pending order did not yet have a browser key. Its customer URL is
  // deliberately unguessable, so the first browser opening it can safely claim
  // the checkout guard without exposing customer information elsewhere.
  if (browserKey && !order.browserKey && order.status === "AWAITING_PAYMENT" && order.expiresAt > new Date()) {
    const [claimed] = await db.update(orders).set({ browserKey, updatedAt: new Date() }).where(and(
      eq(orders.id, order.id),
      sql`${orders.browserKey} is null`,
    )).returning();
    if (claimed) order = claimed;
    else order = await db.query.orders.findFirst({ where: eq(orders.id, order.id) }) || order;
  }
  const [payment, items] = await Promise.all([
    db.query.payments.findFirst({ where: eq(payments.orderId, order.id) }),
    db.select({ item: orderItems, variant: productVariants }).from(orderItems).leftJoin(productVariants, eq(orderItems.variantId, productVariants.id)).where(eq(orderItems.orderId, order.id)),
  ]);
  const paid = payment?.status === "PAID";
  const delivered = paid ? await getDeliveryEntries(order.id, items) : [];
  const manualDelivery = items.some((row) => row.item.fulfillmentMode === "MANUAL_WHATSAPP");
  const isOwnerBrowser = Boolean(browserKey && order.browserKey && safeSecretEqual(browserKey, order.browserKey));
  const cancelled = isOwnerBrowser ? await db.select({ count: sql<number>`count(*)::int` }).from(orders).where(and(
    eq(orders.browserKey, browserKey!),
    sql`${orders.customerCancelledAt} is not null`,
  )) : [];
  const cancellationsRemaining = Math.max(0, 3 - (cancelled[0]?.count || 0));
  const storePhone = process.env.STORE_WHATSAPP || "";
  const message = `Halo Admin FG Store, pembayaran pesanan saya sudah berhasil dan saya menunggu kode atau URL produk.\n\nOrder: ${order.orderNumber}\nProduk: ${items.map((row) => `${row.item.productName} — ${row.item.variantName}`).join(", ")}\nNama: ${order.buyerName}`;
  return {
    order: {
      number: order.orderNumber,
      token: order.publicToken,
      status: order.status,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail ? order.buyerEmail.replace(/(^.).*(@.*$)/, "$1•••$2") : null,
      totalAmount: order.totalAmount,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      whatsappUrl: paid && manualDelivery && storePhone ? waLink(storePhone, message) : null,
      emailDeliveryStatus: order.deliveryEmailStatus,
      canCancel: isOwnerBrowser && order.status === "AWAITING_PAYMENT" && payment?.status === "PENDING" && order.expiresAt > new Date() && cancellationsRemaining > 0,
      cancellationsRemaining,
    },
    payment: payment ? { status: payment.status, provider: payment.provider, qrImage: payment.qrImage, qrUrl: payment.qrUrl, totalAmount: payment.totalAmount } : null,
    items: items.map((row) => ({ productName: row.item.productName, variantName: row.item.variantName, fulfillmentMode: row.item.fulfillmentMode, price: row.item.price })),
    delivery: delivered,
  };
}

export async function processOrderDeliveryEmail(orderId: string) {
  if (!db) return { status: "unavailable" as const };
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const [claimed] = await db.update(orders).set({
    deliveryEmailStatus: "SENDING",
    deliveryEmailAttempts: sql`${orders.deliveryEmailAttempts} + 1`,
    deliveryEmailLastError: null,
    updatedAt: new Date(),
  }).where(and(eq(orders.id, orderId), or(
    inArray(orders.deliveryEmailStatus, ["PENDING", "FAILED"]),
    and(eq(orders.deliveryEmailStatus, "SENDING"), lt(orders.updatedAt, staleBefore)),
  ))).returning();
  if (!claimed) return { status: "not-claimed" as const };
  if (!claimed.buyerEmail) {
    await db.update(orders).set({ deliveryEmailStatus: "SKIPPED", deliveryEmailLastError: "Pembeli tidak mengisi email.", updatedAt: new Date() }).where(eq(orders.id, orderId));
    return { status: "skipped" as const };
  }

  try {
    const customer = await getOrderForCustomer(claimed.publicToken);
    if (!customer) throw new Error("Data order tidak ditemukan untuk email.");
    const baseUrl = (process.env.APP_BASE_URL || process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "");
    const orderUrl = `${baseUrl}/pesanan/${claimed.publicToken}`;
    const manual = Boolean(customer.order.whatsappUrl);
    const deliveryHtml = customer.delivery.length ? customer.delivery.map((entry) => {
      const safeValue = escapeEmailHtml(entry.value);
      return `<div style="margin:12px 0;padding:14px;border:1px solid #dbeafe;border-radius:12px"><strong>${escapeEmailHtml(entry.label)}</strong><br>${entry.kind === "url" ? `<a href="${safeValue}">${safeValue}</a>` : `<code>${safeValue}</code>`}</div>`;
    }).join("") : `<p>Produk ini dikirim manual. Gunakan tombol WhatsApp di halaman pesanan setelah pembayaran terverifikasi.</p>`;
    const safeName = escapeEmailHtml(claimed.buyerName);
    const safeOrder = escapeEmailHtml(claimed.orderNumber);
    const html = `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px"><p style="color:#0891b2;font-weight:700">FG STORE</p><h1 style="font-size:25px">Pembayaran berhasil</h1><p>Halo ${safeName}, pembayaran untuk order <strong>${safeOrder}</strong> sudah terverifikasi.</p>${deliveryHtml}<p><a href="${escapeEmailHtml(orderUrl)}" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none">${manual ? "Buka pesanan & WhatsApp admin" : "Buka halaman pesanan"}</a></p><p style="margin-top:24px;color:#64748b;font-size:13px">Jangan teruskan email ini karena dapat berisi akses digital milikmu.</p></div></div></body></html>`;
    const text = [`Halo ${claimed.buyerName},`, `Pembayaran order ${claimed.orderNumber} sudah berhasil.`, ...customer.delivery.map((entry) => `${entry.label}: ${entry.value}`), manual ? "Produk akan dikirim manual melalui WhatsApp admin." : "", `Halaman pesanan: ${orderUrl}`, "Jangan teruskan email ini karena dapat berisi akses digital milikmu."].filter(Boolean).join("\n\n");
    const sent = await sendTransactionalEmail({ to: claimed.buyerEmail, subject: `Pembayaran berhasil — ${claimed.orderNumber}`, html, text, idempotencyKey: `order-delivery/${claimed.id}` });
    await db.update(orders).set({
      deliveryEmailStatus: sent.status === "sent" ? "SENT" : "SKIPPED",
      deliveryEmailProviderId: sent.providerId,
      deliveryEmailSentAt: sent.status === "sent" ? new Date() : null,
      deliveryEmailLastError: sent.status === "disabled" ? "Provider email belum diaktifkan." : null,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));
    return sent;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Email gagal dikirim.";
    await db.update(orders).set({ deliveryEmailStatus: "FAILED", deliveryEmailLastError: message, updatedAt: new Date() }).where(eq(orders.id, orderId));
    return { status: "failed" as const, error: message };
  }
}

export async function retryOrderDeliveryEmail(orderId: string) {
  if (!db) throw new Error("Store database is not configured.");
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new Error("Order tidak ditemukan.");
  if (order.status === "MANUAL_REVIEW") throw new Error("Pesanan masih menunggu review atau alokasi stok admin.");
  if (!order.buyerEmail) throw new Error("Pembeli tidak mengisi email.");
  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, orderId) });
  if (payment?.status !== "PAID") throw new Error("Email hanya dapat dikirim setelah pembayaran terverifikasi.");
  await db.update(orders).set({ deliveryEmailStatus: "PENDING", deliveryEmailLastError: null, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return processOrderDeliveryEmail(orderId);
}

export async function importInventory(variantId: string, entries: string[]) {
  if (!db) throw new Error("Store database is not configured.");
  const clean = [...new Set(entries.map((entry) => entry.trim()).filter(Boolean))];
  if (!clean.length) return 0;
  const inserted = await db.insert(inventoryItems).values(await Promise.all(clean.map(async (value) => ({ variantId, encryptedValue: encryptSecret(value), fingerprint: await sha256(value) })))).onConflictDoNothing().returning({ id: inventoryItems.id });
  return inserted.length;
}
