import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { categories, products } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";

const schema = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80), description: z.string().max(240).optional() });
export async function GET() { try { await requireAdmin(); if (!db) throw new Error("Database belum terhubung."); return NextResponse.json(await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name))); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Tidak dapat memuat kategori." }, { status: 401 }); } }
export async function POST(request: Request) { try { assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung."); const input = schema.parse(await request.json()); const [created] = await db.insert(categories).values({ ...input, description: input.description || null }).returning(); return NextResponse.json(created, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kategori gagal dibuat." }, { status: 400 }); } }
