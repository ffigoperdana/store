import { lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimitBuckets } from "@/db/schema";
import { sha256 } from "@/lib/crypto";

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super("Terlalu banyak percobaan checkout. Silakan tunggu beberapa menit lalu coba lagi.");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

function positiveInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

async function consume(scope: string, identity: string, limit: number, windowSeconds: number) {
  if (!db) throw new Error("Store database is not configured.");
  const windowMs = windowSeconds * 1000;
  const nowMs = Date.now();
  const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);
  const keyHash = await sha256(`${process.env.SESSION_SECRET}:${scope}:${identity}`);
  const [bucket] = await db.insert(rateLimitBuckets).values({
    scope,
    keyHash,
    windowStart,
    expiresAt,
  }).onConflictDoUpdate({
    target: [rateLimitBuckets.scope, rateLimitBuckets.keyHash, rateLimitBuckets.windowStart],
    set: {
      hits: sql`${rateLimitBuckets.hits} + 1`,
      expiresAt,
      updatedAt: new Date(),
    },
  }).returning({ hits: rateLimitBuckets.hits });

  if (bucket.hits > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((expiresAt.getTime() - nowMs) / 1000)));
  }
}

export async function enforceCheckoutRateLimit(request: Request, whatsapp: string) {
  if (!db) throw new Error("Store database is not configured.");
  const windowSeconds = positiveInteger(process.env.CHECKOUT_RATE_LIMIT_WINDOW_SECONDS, 600, 86_400);
  const ipLimit = positiveInteger(process.env.CHECKOUT_RATE_LIMIT_IP_MAX, 12, 10_000);
  const phoneLimit = positiveInteger(process.env.CHECKOUT_RATE_LIMIT_PHONE_MAX, 5, 10_000);
  const normalizedPhone = whatsapp.replace(/\D/g, "");
  const ip = requestIp(request);

  await Promise.all([
    consume("checkout-ip", ip, ipLimit, windowSeconds),
    // Binding phone to IP prevents a remote attacker from globally blocking a
    // victim's phone number while still stopping repeated submits per buyer.
    consume("checkout-phone-ip", `${ip}:${normalizedPhone}`, phoneLimit, windowSeconds),
  ]);

  // Opportunistic cleanup keeps the table bounded without a separate cron job.
  if (Math.random() < 0.02) {
    await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.expiresAt, new Date())).catch(() => undefined);
  }
}
