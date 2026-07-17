import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/auth";
import { createCheckout } from "@/lib/orders";

const payload = z.object({
  variantId: z.string().uuid(),
  buyerName: z.string().trim().min(2).max(80),
  buyerWhatsapp: z.string().trim().min(8).max(24),
  buyerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = payload.parse(await request.json());
    const origin = new URL(request.url).origin;
    const order = await createCheckout({ ...body, origin });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Data checkout belum lengkap atau tidak valid." : error instanceof Error ? error.message : "Checkout gagal dibuat.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
