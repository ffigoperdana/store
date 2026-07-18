import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveCheckoutForBrowser } from "@/lib/orders";

const query = z.object({ browserKey: z.string().uuid() });

export async function GET(request: Request) {
  const parsed = query.safeParse({ browserKey: new URL(request.url).searchParams.get("browserKey") });
  if (!parsed.success) return NextResponse.json({ active: null }, { headers: { "Cache-Control": "no-store" } });
  const active = await getActiveCheckoutForBrowser(parsed.data.browserKey);
  return NextResponse.json({ active }, { headers: { "Cache-Control": "no-store" } });
}
