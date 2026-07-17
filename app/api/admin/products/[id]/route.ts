import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(), slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
  shortDescription: z.string().trim().min(4).max(240).optional(), description: z.string().max(5000).optional(), coverUrl: z.string().url().nullable().optional(),
  publicationStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(), availabilityMode: z.enum(["AUTO", "FORCE_AVAILABLE", "FORCE_SOLD_OUT"]).optional(), featured: z.boolean().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung.");
    const { id } = await params; const input = schema.parse(await request.json());
    const [updated] = await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Produk gagal diperbarui." }, { status: 400 }); }
}
