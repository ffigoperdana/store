import { after, NextResponse } from "next/server";
import { markPaymentFromCallback, processOrderDeliveryEmail } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, unknown>;
    if (contentType.includes("application/json")) payload = await request.json() as Record<string, unknown>;
    else payload = Object.fromEntries((await request.formData()).entries());
    const result = await markPaymentFromCallback(payload);
    if (result.paid) after(() => processOrderDeliveryEmail(result.orderId));
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("KlikQRIS callback rejected", error);
    const message = error instanceof Error ? error.message : "Callback failed";
    const status = /Invalid|Missing|Unknown/.test(message) ? 400 : 500;
    return NextResponse.json({ received: false }, { status });
  }
}
