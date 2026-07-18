import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdmin } from "@/lib/auth";
import { retryOrderDeliveryEmail } from "@/lib/orders";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const { id } = await params;
    const result = await retryOrderDeliveryEmail(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Email gagal dikirim ulang." }, { status: 400 });
  }
}
