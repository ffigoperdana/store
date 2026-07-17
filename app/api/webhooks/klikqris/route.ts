import { NextResponse } from "next/server";
import { markPaymentFromCallback } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, unknown>;
    if (contentType.includes("application/json")) payload = await request.json() as Record<string, unknown>;
    else payload = Object.fromEntries((await request.formData()).entries());
    const result = await markPaymentFromCallback(payload);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("KlikQRIS callback rejected", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
