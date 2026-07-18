import { after, NextResponse } from "next/server";
import { getOrderForCustomer, processOrderDeliveryEmail, reconcilePendingOrderPayment } from "@/lib/orders";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const browserKey = new URL(request.url).searchParams.get("browserKey") || undefined;
  const reconciliation = await reconcilePendingOrderPayment(token);
  if (reconciliation?.paid) after(() => processOrderDeliveryEmail(reconciliation.orderId));
  const result = await getOrderForCustomer(token, browserKey);
  if (!result) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
