import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { inventoryItems, orderItems, orders, payments, productVariants, products } from "@/db/schema";
import { decryptSecret, encryptSecret, randomToken, sha256 } from "@/lib/crypto";
import { createPayment, normalizeProviderStatus } from "@/lib/payment-provider";

type CheckoutInput = { variantId: string; buyerName: string; buyerWhatsapp: string; buyerEmail?: string; origin: string };

const ORDER_PREFIX = "FGS";

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${ORDER_PREFIX}-${date}-${randomToken(5).toUpperCase()}`;
}

export function normalizeWhatsapp(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (cleaned.startsWith("0")) return `62${cleaned.slice(1)}`;
  return cleaned.startsWith("62") ? cleaned : cleaned;
}

function waLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export async function createCheckout(input: CheckoutInput) {
  if (!db) throw new Error("Store database is not configured.");
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

  const publicToken = randomToken(24);
  const number = orderNumber();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const buyerWhatsapp = normalizeWhatsapp(input.buyerWhatsapp);
  let orderId = "";
  let reserved = false;

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: number,
        publicToken,
        buyerName: input.buyerName.trim(),
        buyerWhatsapp,
        buyerEmail: input.buyerEmail?.trim().toLowerCase() || null,
        subtotal: record.variant.price,
        totalAmount: record.variant.price,
        expiresAt,
      })
      .returning({ id: orders.id });
    orderId = order.id;
    await tx.insert(orderItems).values({
      orderId,
      variantId: record.variant.id,
      productName: record.product.name,
      variantName: record.variant.name,
      sku: record.variant.sku,
      price: record.variant.price,
      quantity: 1,
      fulfillmentMode: record.variant.fulfillmentMode,
      snapshot: { duration: record.variant.duration, warranty: record.variant.warranty, channel: record.variant.channel, estimatedProcess: record.variant.estimatedProcess },
    });
    if (record.variant.fulfillmentMode === "UNIQUE_POOL") {
      const candidates = await tx.execute(sql`
        select id from inventory_items
        where variant_id = ${record.variant.id}::uuid and status = 'AVAILABLE'
        order by created_at asc
        for update skip locked
        limit 1
      `);
      const inventoryId = candidates[0]?.id as string | undefined;
      if (!inventoryId) throw new Error("Stok produk sudah habis.");
      await tx.update(inventoryItems).set({ status: "RESERVED", reservedOrderId: orderId, reservedUntil: expiresAt }).where(eq(inventoryItems.id, inventoryId));
      reserved = true;
    }
  });

  try {
    const payment = await createPayment({
      orderNumber: number,
      amount: record.variant.price,
      description: `${record.product.name} — ${record.variant.name}`,
      callbackUrl: `${(process.env.PUBLIC_BASE_URL || input.origin).replace(/\/$/, "")}/api/webhooks/klikqris`,
    });
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ totalAmount: payment.totalAmount, expiresAt: payment.expiresAt }).where(eq(orders.id, orderId));
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
        rawResponse: payment.raw,
      });
    });
  } catch (error) {
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: "CANCELLED" }).where(eq(orders.id, orderId));
      if (reserved) await tx.update(inventoryItems).set({ status: "AVAILABLE", reservedOrderId: null, reservedUntil: null }).where(eq(inventoryItems.reservedOrderId, orderId));
    });
    throw error;
  }
  return { publicToken, orderNumber: number };
}

export async function markPaymentFromCallback(payload: Record<string, unknown>) {
  if (!db) throw new Error("Store database is not configured.");
  const providerOrderId = String(payload.order_id ?? payload.orderId ?? payload.reference ?? "");
  const callbackSignature = String(payload.signature ?? payload.callback_signature ?? "");
  if (!providerOrderId) throw new Error("Missing payment order reference.");
  const payment = await db.query.payments.findFirst({ where: eq(payments.providerOrderId, providerOrderId) });
  if (!payment) throw new Error("Unknown payment reference.");
  if (payment.provider === "klikqris" && (!payment.signature || callbackSignature !== payment.signature)) {
    throw new Error("Invalid payment callback signature.");
  }
  const status = normalizeProviderStatus(payload);
  if (status !== "PAID") {
    await db.update(payments).set({ providerStatus: status === "EXPIRED" ? "EXPIRED" : status === "FAILED" ? "FAILED" : "PENDING" }).where(eq(payments.id, payment.id));
    return { paid: false, orderId: payment.orderId };
  }
  await fulfillPaidOrder(payment.orderId, payment.id, payload);
  return { paid: true, orderId: payment.orderId };
}

export async function fulfillPaidOrder(orderId: string, paymentId?: string, rawPayload?: Record<string, unknown>) {
  if (!db) throw new Error("Store database is not configured.");
  await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order || ["PAID", "FULFILLED"].includes(order.status)) return;
    if (order.status !== "AWAITING_PAYMENT") throw new Error("Order cannot be fulfilled from its current status.");
    if (paymentId) await tx.update(payments).set({ status: "PAID", providerStatus: "PAID", rawResponse: rawPayload ?? undefined }).where(eq(payments.id, paymentId));
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const isAutomatic = items.every((item) => item.fulfillmentMode !== "MANUAL_WHATSAPP");
    await tx.update(orders).set({ status: isAutomatic ? "FULFILLED" : "PAID", paidAt: new Date(), fulfilledAt: isAutomatic ? new Date() : null }).where(eq(orders.id, orderId));
    if (items.some((item) => item.fulfillmentMode === "UNIQUE_POOL")) {
      await tx.update(inventoryItems).set({ status: "DELIVERED", deliveredOrderId: orderId, deliveredAt: new Date() }).where(and(eq(inventoryItems.reservedOrderId, orderId), eq(inventoryItems.status, "RESERVED")));
    }
  });
}

export async function markMockPayment(publicToken: string) {
  if (!db) throw new Error("Store database is not configured.");
  if (process.env.PAYMENT_PROVIDER === "klikqris" || (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAY !== "true")) throw new Error("Mock payment is unavailable.");
  const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, publicToken) });
  if (!order) throw new Error("Order not found.");
  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, order.id) });
  if (!payment) throw new Error("Payment not found.");
  await fulfillPaidOrder(order.id, payment.id, { status: "PAID", order_id: payment.providerOrderId, signature: payment.signature });
}

export async function getOrderForCustomer(publicToken: string) {
  if (!db) return null;
  const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, publicToken) });
  if (!order) return null;
  const [payment, items] = await Promise.all([
    db.query.payments.findFirst({ where: eq(payments.orderId, order.id) }),
    db.select({ item: orderItems, variant: productVariants }).from(orderItems).leftJoin(productVariants, eq(orderItems.variantId, productVariants.id)).where(eq(orderItems.orderId, order.id)),
  ]);
  const delivered: Array<{ label: string; value: string }> = [];
  if (["PAID", "FULFILLED"].includes(order.status)) {
    for (const row of items) {
      if (row.item.fulfillmentMode === "SINGLE_SHARED" && row.variant?.sharedDeliveryValue) delivered.push({ label: row.variant.sharedDeliveryLabel || "Akses digital", value: decryptSecret(row.variant.sharedDeliveryValue) });
      if (row.item.fulfillmentMode === "UNIQUE_POOL") {
        const inventory = await db.query.inventoryItems.findFirst({ where: eq(inventoryItems.deliveredOrderId, order.id) });
        if (inventory) delivered.push({ label: "Akses unik", value: decryptSecret(inventory.encryptedValue) });
      }
    }
  }
  const storePhone = process.env.STORE_WHATSAPP || "";
  const message = `Halo Admin FG Store, pesanan saya sudah PAID dan menunggu pengiriman.\n\nOrder: ${order.orderNumber}\nProduk: ${items.map((row) => `${row.item.productName} — ${row.item.variantName}`).join(", ")}\nNama: ${order.buyerName}`;
  return {
    order: { number: order.orderNumber, token: order.publicToken, status: order.status, buyerName: order.buyerName, totalAmount: order.totalAmount, expiresAt: order.expiresAt, paidAt: order.paidAt, whatsappUrl: storePhone ? waLink(storePhone, message) : null },
    payment: payment ? { status: payment.status, provider: payment.provider, qrImage: payment.qrImage, qrUrl: payment.qrUrl, totalAmount: payment.totalAmount } : null,
    items: items.map((row) => ({ productName: row.item.productName, variantName: row.item.variantName, fulfillmentMode: row.item.fulfillmentMode, price: row.item.price })),
    delivery: delivered,
  };
}

export async function importInventory(variantId: string, entries: string[]) {
  if (!db) throw new Error("Store database is not configured.");
  const clean = [...new Set(entries.map((entry) => entry.trim()).filter(Boolean))];
  if (!clean.length) return 0;
  await db.insert(inventoryItems).values(await Promise.all(clean.map(async (value) => ({ variantId, encryptedValue: encryptSecret(value), fingerprint: await sha256(value) })))).onConflictDoNothing();
  return clean.length;
}
