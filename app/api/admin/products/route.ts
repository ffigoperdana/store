import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { categories, inventoryItems, products, productVariants } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { ensureStoreBootstrap } from "@/lib/store-bootstrap";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120), slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().trim().min(4).max(240), description: z.string().max(5000).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")), publicationStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  availabilityMode: z.enum(["AUTO", "FORCE_AVAILABLE", "FORCE_SOLD_OUT"]).default("AUTO"), featured: z.boolean().default(false),
  categoryId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    if (!db) throw new Error("Database belum terhubung.");
    await ensureStoreBootstrap();
    const [rows, inventoryCounts] = await Promise.all([
      db.select({ product: products, variant: productVariants, category: categories }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(productVariants, eq(productVariants.productId, products.id)).orderBy(desc(products.updatedAt)),
      db.select({ variantId: inventoryItems.variantId, status: inventoryItems.status, count: sql<number>`count(*)::int` }).from(inventoryItems).groupBy(inventoryItems.variantId, inventoryItems.status),
    ]);
    const counts = new Map<string, { available: number; delivered: number; reserved: number }>();
    for (const row of inventoryCounts) {
      const current = counts.get(row.variantId) ?? { available: 0, delivered: 0, reserved: 0 };
      if (row.status === "AVAILABLE") current.available = row.count;
      if (row.status === "DELIVERED") current.delivered = row.count;
      if (row.status === "RESERVED") current.reserved = row.count;
      counts.set(row.variantId, current);
    }
    type SafeVariant = Omit<typeof productVariants.$inferSelect, "sharedDeliveryValue"> & { sharedDeliveryConfigured: boolean; availableInventory: number; deliveredInventory: number; reservedInventory: number };
    const grouped = new Map<string, typeof rows[number]["product"] & { categoryName: string | null; categorySlug: string | null; variants: SafeVariant[] }>();
    for (const row of rows) {
      const product = grouped.get(row.product.id) ?? { ...row.product, categoryName: row.category?.name ?? null, categorySlug: row.category?.slug ?? null, variants: [] };
      if (row.variant) {
        const { sharedDeliveryValue, ...safeVariant } = row.variant;
        const inventory = counts.get(row.variant.id) ?? { available: 0, delivered: 0, reserved: 0 };
        product.variants.push({ ...safeVariant, sharedDeliveryConfigured: row.variant.fulfillmentMode === "SINGLE_SHARED" && Boolean(sharedDeliveryValue), availableInventory: inventory.available, deliveredInventory: inventory.delivered, reservedInventory: inventory.reserved });
      }
      grouped.set(row.product.id, product);
    }
    return NextResponse.json([...grouped.values()]);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Tidak dapat memuat produk." }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung.");
    const input = productSchema.parse(await request.json());
    const [created] = await db.insert(products).values({ ...input, description: input.description || "", coverUrl: input.coverUrl || null }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Produk gagal dibuat." }, { status: 400 }); }
}
