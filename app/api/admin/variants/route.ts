import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { productVariants } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";

const variantSchema = z.object({
  productId: z.string().uuid(), sku: z.string().trim().min(2).max(80), name: z.string().trim().min(2).max(120), price: z.number().int().nonnegative(), compareAtPrice: z.number().int().nonnegative().nullable().optional(),
  fulfillmentMode: z.enum(["MANUAL_WHATSAPP", "SINGLE_SHARED", "UNIQUE_POOL"]), status: z.enum(["ACTIVE", "DISABLED", "ARCHIVED"]).default("ACTIVE"),
  duration: z.string().max(120).optional(), warranty: z.string().max(120).optional(), channel: z.string().max(120).optional(), estimatedProcess: z.string().max(160).optional(),
  sharedDeliveryValue: z.string().max(4000).optional(), sharedDeliveryLabel: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung.");
    const input = variantSchema.parse(await request.json());
    if (input.fulfillmentMode === "SINGLE_SHARED" && !input.sharedDeliveryValue) throw new Error("Akses bersama wajib diisi untuk delivery single input.");
    const [variant] = await db.insert(productVariants).values({ ...input, sharedDeliveryValue: input.sharedDeliveryValue ? (await import("@/lib/crypto")).encryptSecret(input.sharedDeliveryValue) : null }).returning();
    return NextResponse.json(variant, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Varian gagal dibuat." }, { status: 400 }); }
}
