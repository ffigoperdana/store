import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, products, productVariants } from "@/db/schema";

/** Provides a usable first catalogue; disable with AUTO_SEED_CATALOG=false. */
export async function ensureStarterCatalog() {
  if (!db || process.env.AUTO_SEED_CATALOG === "false") return;
  const existing = await db.query.products.findFirst({ where: eq(products.slug, "chatgpt-plus") });
  if (existing) return;
  await db.transaction(async (tx) => {
    const category = await tx.query.categories.findFirst({ where: eq(categories.slug, "chatgpt-plus") });
    const categoryId = category?.id || (await tx.insert(categories).values({ name: "ChatGPT Plus", slug: "chatgpt-plus", description: "Paket ChatGPT Plus dan panduan redeem." }).returning({ id: categories.id }))[0].id;
    const [product] = await tx.insert(products).values({ categoryId, name: "ChatGPT Plus", slug: "chatgpt-plus", shortDescription: "Paket ChatGPT Plus dengan alur checkout QRIS dan panduan redeem.", description: "Pilih paket sesuai channel dan ketentuan yang tersedia.", publicationStatus: "PUBLISHED", featured: true }).returning({ id: products.id });
    await tx.insert(productVariants).values([
      { productId: product.id, sku: "A", name: "AI ChatGPT Plus 1 Month Private", price: 34000, compareAtPrice: 47000, channel: "Channel India (UPI)", duration: "Maksimal 1 bulan", estimatedProcess: "Ready: diproses setelah pembayaran", fulfillmentMode: "MANUAL_WHATSAPP" },
      { productId: product.id, sku: "BZ.1", name: "ChatGPT Plus 1 Month Private", price: 38000, compareAtPrice: 55000, channel: "Channel Brazil (PIX) · Redeem Code", duration: "Maksimal 1 bulan", estimatedProcess: "Ready / PO mengikuti stok", fulfillmentMode: "MANUAL_WHATSAPP" },
      { productId: product.id, sku: "C2", name: "AI ChatGPT Plus 1 Month Private", price: 85000, channel: "All payment Apple Pay", duration: "25–28 hari", warranty: "Sampai 7 hari", estimatedProcess: "Ready: akun dikirim setelah pembayaran", fulfillmentMode: "MANUAL_WHATSAPP" },
    ]);
  });
}
