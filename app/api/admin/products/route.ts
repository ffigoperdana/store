import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { products, productVariants } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";

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
    const rows = await db.select({ product: products, variant: productVariants }).from(products).leftJoin(productVariants, eq(productVariants.productId, products.id)).orderBy(desc(products.updatedAt));
    const grouped = new Map<string, typeof rows[number]["product"] & { variants: Array<NonNullable<typeof rows[number]["variant"]>> }>();
    for (const row of rows) {
      const product = grouped.get(row.product.id) ?? { ...row.product, variants: [] };
      if (row.variant) product.variants.push(row.variant);
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
