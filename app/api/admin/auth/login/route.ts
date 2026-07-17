import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, authenticateAdmin, createSession, setSession } from "@/lib/auth";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = bodySchema.parse(await request.json());
    const user = await authenticateAdmin(body.email, body.password);
    if (!user) return NextResponse.json({ error: "Email atau password tidak tepat." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    setSession(response, await createSession(user));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login gagal." }, { status: 400 });
  }
}
