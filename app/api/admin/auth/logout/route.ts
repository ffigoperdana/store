import { NextResponse } from "next/server";
import { assertSameOrigin, clearSession } from "@/lib/auth";

export async function POST(request: Request) {
  assertSameOrigin(request);
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  return response;
}
