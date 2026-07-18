import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/auth";
import { cancelCheckoutForBrowser, CancellationLimitError } from "@/lib/orders";

const payload = z.object({ browserKey: z.string().uuid() });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    const body = payload.parse(await request.json());
    const result = await cancelCheckoutForBrowser(token, body.browserKey);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof CancellationLimitError ? 429 : error instanceof z.ZodError ? 400 : 409;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pembatalan tidak dapat diproses." }, { status });
  }
}
