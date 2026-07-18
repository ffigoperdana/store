import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  inventoryItems,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
} from "@/db/schema";
import { encryptSecret, sha256 } from "@/lib/crypto";

type StarterVariant = {
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  channel?: string;
  duration?: string;
  warranty?: string;
  estimatedProcess?: string;
  fulfillmentMode: "MANUAL_WHATSAPP" | "SINGLE_SHARED" | "UNIQUE_POOL";
  sharedDeliveryValue?: string;
  sharedDeliveryLabel?: string;
};

async function ensureCategory(input: { name: string; slug: string; description: string }) {
  if (!db) throw new Error("Database belum terhubung.");
  await db.insert(categories).values(input).onConflictDoNothing();
  const category = await db.query.categories.findFirst({ where: eq(categories.slug, input.slug) });
  if (!category) throw new Error(`Kategori ${input.slug} gagal disiapkan.`);
  return category;
}

async function ensureProduct(input: {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  featured?: boolean;
}) {
  if (!db) throw new Error("Database belum terhubung.");
  await db.insert(products).values({ ...input, publicationStatus: "PUBLISHED" }).onConflictDoNothing();
  const product = await db.query.products.findFirst({ where: eq(products.slug, input.slug) });
  if (!product) throw new Error(`Produk ${input.slug} gagal disiapkan.`);
  return product;
}

async function ensureVariant(productId: string, input: StarterVariant) {
  if (!db) throw new Error("Database belum terhubung.");
  const sharedDeliveryValue = input.sharedDeliveryValue ? encryptSecret(input.sharedDeliveryValue) : null;
  await db.insert(productVariants).values({ ...input, productId, sharedDeliveryValue }).onConflictDoNothing();
  const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, input.sku) });
  if (!variant) throw new Error(`Varian ${input.sku} gagal disiapkan.`);
  return variant;
}

async function ensureDigitalStarterProducts(demoSharedValue?: string) {
  if (!db) throw new Error("Database belum terhubung.");
  const productivity = await ensureCategory({
    name: "Template & Produktivitas",
    slug: "template-produktivitas",
    description: "Template siap pakai untuk belajar dan bekerja.",
  });
  const learning = await ensureCategory({
    name: "E-book & Learning",
    slug: "ebook-learning",
    description: "Materi digital, prompt pack, dan panduan belajar.",
  });
  const templateProduct = await ensureProduct({
    categoryId: productivity.id,
    name: "Notion Mandarin Starter",
    slug: "notion-mandarin-starter",
    shortDescription: "Roadmap belajar Mandarin, vocabulary tracker, dan daily practice.",
    description: "Template Notion terstruktur untuk membantu belajar Mandarin secara konsisten.",
    featured: true,
  });
  const promptProduct = await ensureProduct({
    categoryId: learning.id,
    name: "Prompt Pack Produktif",
    slug: "prompt-pack-produktif",
    shortDescription: "Kumpulan prompt siap pakai untuk riset, rangkuman, dan produktivitas.",
    description: "Akses unik ke paket prompt digital FG Store.",
  });
  const ebookProduct = await ensureProduct({
    categoryId: learning.id,
    name: "E-book Web Design Dasar",
    slug: "ebook-web-design-dasar",
    shortDescription: "Panduan praktis membangun tampilan web yang rapi dan responsif.",
    description: "E-book digital untuk pemula yang ingin memahami fondasi web design.",
  });

  const templateVariant = await ensureVariant(templateProduct.id, {
    sku: "NOTION-MND-01",
    name: "Lifetime Access",
    price: 100000,
    compareAtPrice: 129000,
    duration: "Akses selamanya",
    fulfillmentMode: "SINGLE_SHARED",
    sharedDeliveryValue: demoSharedValue,
    sharedDeliveryLabel: "Buka template Notion",
  });
  const promptVariant = await ensureVariant(promptProduct.id, {
    sku: "PROMPT-PRO-01",
    name: "Unique Download Link",
    price: 50000,
    duration: "Akses unduhan 30 hari",
    fulfillmentMode: "UNIQUE_POOL",
  });
  const ebookVariant = await ensureVariant(ebookProduct.id, {
    sku: "EBOOK-WEB-01",
    name: "PDF + Bonus Checklist",
    price: 75000,
    fulfillmentMode: "MANUAL_WHATSAPP",
    estimatedProcess: "Dikirim admin setelah pembayaran",
  });

  if (demoSharedValue) {
    await db.update(productVariants).set({
      sharedDeliveryValue: encryptSecret(demoSharedValue),
      sharedDeliveryLabel: "Buka template Notion",
      updatedAt: new Date(),
    }).where(eq(productVariants.id, templateVariant.id));
  }

  return { templateProduct, promptProduct, ebookProduct, templateVariant, promptVariant, ebookVariant };
}

/** Provides a usable first catalogue; disable with AUTO_SEED_CATALOG=false. */
export async function ensureStarterCatalog() {
  if (!db || process.env.AUTO_SEED_CATALOG === "false") return;
  const category = await ensureCategory({
    name: "ChatGPT Plus",
    slug: "chatgpt-plus",
    description: "Paket ChatGPT Plus dan panduan redeem.",
  });
  const product = await ensureProduct({
    categoryId: category.id,
    name: "ChatGPT Plus",
    slug: "chatgpt-plus",
    shortDescription: "Paket ChatGPT Plus dengan alur checkout QRIS dan panduan redeem.",
    description: "Pilih paket sesuai channel dan ketentuan yang tersedia.",
    featured: true,
  });
  await Promise.all([
    ensureVariant(product.id, {
      sku: "A",
      name: "AI ChatGPT Plus 1 Month Private",
      price: 34000,
      compareAtPrice: 47000,
      channel: "Channel India (UPI)",
      duration: "Maksimal 1 bulan",
      estimatedProcess: "Ready: diproses setelah pembayaran",
      fulfillmentMode: "MANUAL_WHATSAPP",
    }),
    ensureVariant(product.id, {
      sku: "BZ.1",
      name: "ChatGPT Plus 1 Month Private",
      price: 38000,
      compareAtPrice: 55000,
      channel: "Channel Brazil (PIX) · Redeem Code",
      duration: "Maksimal 1 bulan",
      estimatedProcess: "Ready / PO mengikuti stok",
      fulfillmentMode: "MANUAL_WHATSAPP",
    }),
    ensureVariant(product.id, {
      sku: "C2",
      name: "AI ChatGPT Plus 1 Month Private",
      price: 85000,
      channel: "All payment Apple Pay",
      duration: "25–28 hari",
      warranty: "Sampai 7 hari",
      estimatedProcess: "Ready: akun dikirim setelah pembayaran",
      fulfillmentMode: "MANUAL_WHATSAPP",
    }),
  ]);
  await ensureDigitalStarterProducts();
}

/**
 * Local-only showcase data. Docker Compose enables it, while Coolify/Dockerfile
 * deployments remain clean unless SEED_DEMO_DATA=true is explicitly configured.
 */
export async function ensureDemoData() {
  if (!db || process.env.SEED_DEMO_DATA !== "true") return;
  await ensureStarterCatalog();
  const sentinel = await db.query.orders.findFirst({ where: eq(orders.orderNumber, "FGS-DEMO-001") });
  if (sentinel) return;

  const {
    templateProduct,
    promptProduct,
    ebookProduct,
    templateVariant,
    promptVariant,
    ebookVariant,
  } = await ensureDigitalStarterProducts("https://example.com/demo-notion-access");
  const gptProduct = await db.query.products.findFirst({ where: eq(products.slug, "chatgpt-plus") });
  const gptVariants = gptProduct
    ? await db.select().from(productVariants).where(eq(productVariants.productId, gptProduct.id))
    : [];
  const bySku = new Map(gptVariants.map((variant) => [variant.sku, variant]));

  const poolValues = ["DEMO-PROMPT-AX91", "DEMO-PROMPT-BK27", "DEMO-PROMPT-CP38", "DEMO-PROMPT-DQ44", "DEMO-PROMPT-ER59"];
  for (const value of poolValues) {
    await db.insert(inventoryItems).values({
      variantId: promptVariant.id,
      encryptedValue: encryptSecret(value),
      fingerprint: await sha256(value),
      note: "Stok demo Docker lokal",
    }).onConflictDoNothing();
  }

  const demoOrders = [
    { buyerName: "Alya Putri", email: "alya@example.test", phone: "6281210011001", status: "FULFILLED", payment: "PAID", variant: bySku.get("A"), daysAgo: 0 },
    { buyerName: "Bima Saputra", email: "bima@example.test", phone: "6281210011002", status: "PAID", payment: "PAID", variant: bySku.get("BZ.1"), daysAgo: 0 },
    { buyerName: "Citra Lestari", email: "citra@example.test", phone: "6281210011003", status: "AWAITING_PAYMENT", payment: "PENDING", variant: bySku.get("C2"), daysAgo: 0 },
    { buyerName: "Daffa Ramadhan", email: "daffa@example.test", phone: "6281210011004", status: "FULFILLED", payment: "PAID", variant: templateVariant, daysAgo: 1 },
    { buyerName: "Eka Wulandari", email: "eka@example.test", phone: "6281210011005", status: "FULFILLED", payment: "PAID", variant: promptVariant, daysAgo: 1 },
    { buyerName: "Farhan Akbar", email: "farhan@example.test", phone: "6281210011006", status: "EXPIRED", payment: "EXPIRED", variant: ebookVariant, daysAgo: 2 },
    { buyerName: "Gita Maharani", email: "gita@example.test", phone: "6281210011007", status: "FULFILLED", payment: "PAID", variant: bySku.get("C2"), daysAgo: 2 },
    { buyerName: "Hadi Pratama", email: "hadi@example.test", phone: "6281210011008", status: "CANCELLED", payment: "FAILED", variant: bySku.get("A"), daysAgo: 3 },
    { buyerName: "Intan Sari", email: "intan@example.test", phone: "6281210011009", status: "PAID", payment: "PAID", variant: ebookVariant, daysAgo: 3 },
    { buyerName: "Joko Wijaya", email: "joko@example.test", phone: "6281210011010", status: "FULFILLED", payment: "PAID", variant: bySku.get("BZ.1"), daysAgo: 4 },
    { buyerName: "Kirana Dewi", email: "kirana@example.test", phone: "6281210011011", status: "FULFILLED", payment: "PAID", variant: templateVariant, daysAgo: 5 },
    { buyerName: "Lukman Hakim", email: "lukman@example.test", phone: "6281210011012", status: "FULFILLED", payment: "PAID", variant: bySku.get("A"), daysAgo: 6 },
  ] as const;

  let index = 0;
  for (const demo of demoOrders) {
    if (!demo.variant) continue;
    index += 1;
    const suffix = String(index).padStart(3, "0");
    const createdAt = new Date(Date.now() - demo.daysAgo * 86_400_000 - index * 1_800_000);
    const isPaid = demo.payment === "PAID";
    const isFulfilled = demo.status === "FULFILLED";
    const [order] = await db.insert(orders).values({
      orderNumber: `FGS-DEMO-${suffix}`,
      publicToken: `demo-order-token-${suffix}`,
      buyerName: demo.buyerName,
      buyerWhatsapp: demo.phone,
      buyerEmail: demo.email,
      status: demo.status,
      subtotal: demo.variant.price,
      totalAmount: demo.variant.price,
      expiresAt: new Date(createdAt.getTime() + 15 * 60_000),
      paidAt: isPaid ? new Date(createdAt.getTime() + 4 * 60_000) : null,
      fulfilledAt: isFulfilled ? new Date(createdAt.getTime() + 35 * 60_000) : null,
      createdAt,
      updatedAt: createdAt,
    }).onConflictDoNothing().returning({ id: orders.id });
    // A parallel first request may win the demo-seed race. The winner will
    // complete the dataset; the other request can return safely.
    if (!order) {
      if (index === 1) return;
      continue;
    }
    await db.insert(orderItems).values({
      orderId: order.id,
      variantId: demo.variant.id,
      productName: demo.variant.productId === gptProduct?.id ? "ChatGPT Plus" : demo.variant.productId === templateProduct.id ? templateProduct.name : demo.variant.productId === promptProduct.id ? promptProduct.name : ebookProduct.name,
      variantName: demo.variant.name,
      sku: demo.variant.sku,
      price: demo.variant.price,
      quantity: 1,
      fulfillmentMode: demo.variant.fulfillmentMode,
      createdAt,
      updatedAt: createdAt,
    });
    await db.insert(payments).values({
      orderId: order.id,
      provider: "mock",
      providerOrderId: `DEMO-PAY-${suffix}`,
      providerStatus: demo.payment,
      status: demo.payment,
      requestedAmount: demo.variant.price,
      totalAmount: demo.variant.price,
      rawResponse: { demo: true, status: demo.payment },
      createdAt,
      updatedAt: createdAt,
    });
  }
}

export async function ensureStoreBootstrap() {
  await ensureStarterCatalog();
  await ensureDemoData();
}
