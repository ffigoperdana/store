import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/auth";
import { createCheckout, findCheckoutByKey } from "@/lib/orders";
import { enforceCheckoutRateLimit, RateLimitError } from "@/lib/rate-limit";

const payload = z.object({
  checkoutKey: z.string().uuid(),
  variantId: z.string().uuid(),
  buyerName: z.string().trim().min(2).max(80),
  buyerWhatsapp: z.string().trim().min(8).max(24),
  buyerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = payload.parse(await request.json());
    const existing = await findCheckoutByKey(body.checkoutKey);
    if (existing) return NextResponse.json({ publicToken: existing.publicToken, orderNumber: existing.orderNumber, reused: true }, { status: 200 });
    await enforceCheckoutRateLimit(request, body.buyerWhatsapp);
    const origin = new URL(request.url).origin;
    const order = await createCheckout({ ...body, origin });
    return NextResponse.json(order, { status: order.reused ? 200 : 201 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { "Retry-After": String(error.retryAfter) },
      });
    }
    const message = error instanceof z.ZodError ? "Data checkout belum lengkap atau tidak valid." : error instanceof Error ? error.message : "Checkout gagal dibuat.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
