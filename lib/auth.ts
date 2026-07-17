import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/crypto";

const COOKIE_NAME = "fg_store_admin";
const encoder = new TextEncoder();

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be configured.");
    return encoder.encode("local-development-session-secret-change-me-32");
  }
  return encoder.encode(secret);
}

export type AdminSession = { id: string; email: string; role: string; name: string };

export async function createSession(user: AdminSession) {
  return new SignJWT({ email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(sessionKey());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === "string" ? payload.name : payload.email };
  } catch {
    return null;
  }
}

export function setSession(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) throw new Error("Cross-origin request rejected.");
}

export async function bootstrapAdmin() {
  if (!db) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });
  if (!existing) {
    await db.insert(adminUsers).values({ email, name: process.env.ADMIN_NAME || "Store owner", passwordHash: await hashPassword(password), role: "OWNER" });
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession | null> {
  if (!db) return null;
  await bootstrapAdmin();
  const user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email.trim().toLowerCase()) });
  if (!user || !user.enabled || !(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
