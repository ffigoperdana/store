import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { productVariants } from "@/db/schema";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({
  sku: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(2).max(180).optional(),
  price: z.number().int().nonnegative().optional(),
  compareAtPrice: z.number().int().nonnegative().nullable().optional(),
  duration: z.string().max(140).nullable().optional(),
  warranty: z.string().max(200).nullable().optional(),
  channel: z.string().max(160).nullable().optional(),
  estimatedProcess: z.string().max(200).nullable().optional(),
  status: z.enum(["ACTIVE", "DISABLED", "ARCHIVED"]).optional(),
  fulfillmentMode: z.enum(["MANUAL_WHATSAPP", "SINGLE_SHARED", "UNIQUE_POOL"]).optional(),
  sharedDeliveryValue: z.string().max(4000).nullable().optional(),
  sharedDeliveryLabel: z.string().max(100).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung.");
    const { id } = await params;
    const input = schema.parse(await request.json());
    const current = await db.query.productVariants.findFirst({ where: eq(productVariants.id, id) });
    if (!current) return NextResponse.json({ error: "Varian tidak ditemukan." }, { status: 404 });
    const effectiveMode = input.fulfillmentMode ?? current.fulfillmentMode;
    const { sharedDeliveryValue: requestedSharedValue, ...safeInput } = input;
    let sharedDeliveryValue = current.sharedDeliveryValue;
    if (effectiveMode !== "SINGLE_SHARED") {
      sharedDeliveryValue = null;
    } else if (typeof requestedSharedValue === "string" && requestedSharedValue.trim()) {
      sharedDeliveryValue = encryptSecret(requestedSharedValue.trim());
    } else if (requestedSharedValue === null || current.fulfillmentMode !== "SINGLE_SHARED" || !current.sharedDeliveryValue) {
      throw new Error("URL atau kode shared wajib diisi saat mengaktifkan mode satu akses bersama.");
    }
    const [updated] = await db.update(productVariants).set({
      ...safeInput,
      sharedDeliveryValue,
      ...(effectiveMode !== "SINGLE_SHARED" ? { sharedDeliveryLabel: null } : {}),
      updatedAt: new Date(),
    }).where(eq(productVariants.id, id)).returning();
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Varian tidak ditemukan." }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Varian gagal diperbarui." }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); await requireAdmin(); if (!db) throw new Error("Database belum terhubung.");
    const { id } = await params;
    const [archived] = await db.update(productVariants).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(productVariants.id, id)).returning();
    return archived ? NextResponse.json({ archived: true }) : NextResponse.json({ error: "Varian tidak ditemukan." }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Varian gagal dihapus." }, { status: 400 }); }
}
