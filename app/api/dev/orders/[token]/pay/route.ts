import { after, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/auth";
import { markMockPayment, processOrderDeliveryEmail } from "@/lib/orders";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    const result = await markMockPayment(token);
    after(() => processOrderDeliveryEmail(result.orderId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pembayaran simulasi gagal." }, { status: 400 });
  }
}
