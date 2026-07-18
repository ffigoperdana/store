import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { categories, products } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";

const schema = z.object({ name: z.string().trim().min(2).max(80).optional(), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80).optional(), description: z.string().max(240).nullable().optional(), hidden: z.boolean().optional(), sortOrder: z.number().int().optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung."); const input = schema.parse(await request.json()); const { id } = await params; const [updated] = await db.update(categories).set({ ...input, updatedAt: new Date() }).where(eq(categories.id, id)).returning(); return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kategori gagal diperbarui." }, { status: 400 }); } }

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung."); const { id } = await params; const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id)); if (count > 0) return NextResponse.json({ error: "Kategori masih memiliki produk. Pindahkan produknya terlebih dahulu." }, { status: 409 }); const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning(); return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kategori gagal dihapus." }, { status: 400 }); } }
