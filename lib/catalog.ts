import { and, asc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, inventoryItems, productVariants, products } from "@/db/schema";
import { ensureStarterCatalog } from "@/lib/store-bootstrap";

export type PublicVariant = {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  duration: string | null;
  warranty: string | null;
  channel: string | null;
  estimatedProcess: string | null;
  fulfillmentMode: "MANUAL_WHATSAPP" | "SINGLE_SHARED" | "UNIQUE_POOL";
  available: boolean;
  remaining: number | null;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverUrl: string | null;
  featured: boolean;
  category: string | null;
  categorySlug: string | null;
  variants: PublicVariant[];
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export async function getPublicCategories(): Promise<PublicCategory[]> {
  if (!db) return [];
  await ensureStarterCatalog();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.hidden, false))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getPublicCatalog(): Promise<PublicProduct[]> {
  if (!db) return [];
  await ensureStarterCatalog();
  // Keep an abandoned QR checkout from making the last pool item look sold
  // out forever. The checkout path performs the same cleanup under lock.
  await db.update(inventoryItems).set({
    status: "AVAILABLE",
    reservedOrderId: null,
    reservedUntil: null,
    updatedAt: new Date(),
  }).where(and(eq(inventoryItems.status, "RESERVED"), lt(inventoryItems.reservedUntil, new Date())));
  const rows = await db
    .select({ product: products, variant: productVariants, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.status, "ACTIVE")))
    .where(and(eq(products.publicationStatus, "PUBLISHED"), or(isNull(categories.id), eq(categories.hidden, false))))
    .orderBy(asc(products.sortOrder), asc(products.name), asc(productVariants.name));

  const uniqueIds = rows
    .filter((row) => row.variant?.fulfillmentMode === "UNIQUE_POOL")
    .map((row) => row.variant!.id);
  const counts = new Map<string, number>();
  if (uniqueIds.length) {
    const stockRows = await db
      .select({ variantId: inventoryItems.variantId, amount: sql<number>`count(*)::int` })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.status, "AVAILABLE"), inArray(inventoryItems.variantId, uniqueIds)))
      .groupBy(inventoryItems.variantId);
    stockRows.forEach((item) => counts.set(item.variantId, item.amount));
  }

  const grouped = new Map<string, PublicProduct>();
  for (const row of rows) {
    const current = grouped.get(row.product.id) ?? {
      id: row.product.id,
      slug: row.product.slug,
      name: row.product.name,
      shortDescription: row.product.shortDescription,
      description: row.product.description,
      coverUrl: row.product.coverUrl,
      featured: row.product.featured,
      category: row.category?.name ?? null,
      categorySlug: row.category?.slug ?? null,
      variants: [],
    };
    if (row.variant) {
      const variant = row.variant;
      const remaining = variant.fulfillmentMode === "UNIQUE_POOL" ? counts.get(variant.id) ?? 0 : null;
      const deliveryConfigured = variant.fulfillmentMode !== "SINGLE_SHARED" || Boolean(variant.sharedDeliveryValue);
      current.variants.push({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        duration: variant.duration,
        warranty: variant.warranty,
        channel: variant.channel,
        estimatedProcess: variant.estimatedProcess,
        fulfillmentMode: variant.fulfillmentMode,
        available: row.product.availabilityMode !== "FORCE_SOLD_OUT" && deliveryConfigured && (remaining === null || remaining > 0),
        remaining,
      });
    }
    grouped.set(row.product.id, current);
  }
  return [...grouped.values()];
}

export async function getPublicProduct(slug: string) {
  return (await getPublicCatalog()).find((product) => product.slug === slug) ?? null;
}

export async function getCategoryProducts(categorySlug: string) {
  return (await getPublicCatalog()).filter((product) => product.categorySlug === categorySlug);
}
