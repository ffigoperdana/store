import { NextResponse } from "next/server";
import { getOrderForCustomer } from "@/lib/orders";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getOrderForCustomer(token);
  if (!result) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
