import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/auth";
import { markMockPayment } from "@/lib/orders";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    await markMockPayment(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pembayaran simulasi gagal." }, { status: 400 });
  }
}
