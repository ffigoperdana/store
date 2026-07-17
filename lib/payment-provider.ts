import { randomToken } from "@/lib/crypto";

export type PaymentRequest = { orderNumber: string; amount: number; description: string; callbackUrl: string };
export type PaymentResponse = {
  provider: "mock" | "klikqris";
  providerOrderId: string;
  signature: string;
  qrImage: string | null;
  qrUrl: string | null;
  requestedAmount: number;
  uniqueAmount: number;
  totalAmount: number;
  expiresAt: Date;
  raw: Record<string, unknown>;
};

function getValue(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  const provider = process.env.PAYMENT_PROVIDER === "klikqris" ? "klikqris" : "mock";
  if (provider === "mock") {
    const providerOrderId = `MOCK-${request.orderNumber}`;
    const signature = randomToken(18);
    return {
      provider,
      providerOrderId,
      signature,
      qrImage: null,
      qrUrl: null,
      requestedAmount: request.amount,
      uniqueAmount: 0,
      totalAmount: request.amount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      raw: { mode: "mock", callback_url: request.callbackUrl },
    };
  }

  const apiKey = process.env.KLIKQRIS_API_KEY;
  const merchantId = process.env.KLIKQRIS_MERCHANT_ID;
  if (!apiKey || !merchantId) throw new Error("KlikQRIS credentials are not configured.");
  const sandbox = process.env.KLIKQRIS_ENV === "sandbox";
  const mode = process.env.KLIKQRIS_MODE === "MYPG" ? "MYPG" : "PG";
  const endpoint = sandbox
    ? "https://klikqris.com/api/sandbox/qris/create"
    : `https://klikqris.com/api/${mode === "MYPG" ? "qrisv2" : "qris"}/create`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, id_merchant: merchantId },
    body: JSON.stringify({ amount: request.amount, order_id: request.orderNumber, description: request.description, callback_url: request.callbackUrl }),
    cache: "no-store",
  });
  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || raw.status === false) throw new Error(String(raw.message ?? "KlikQRIS could not create a payment."));
  const data = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const totalAmount = Number(getValue(data, "total_amount", "amount", "total") ?? request.amount);
  const expiresValue = getValue(data, "expired_at", "expires_at", "expiration");
  const expiresAt = expiresValue ? new Date(String(expiresValue)) : new Date(Date.now() + 15 * 60 * 1000);
  return {
    provider,
    providerOrderId: String(getValue(data, "order_id", "transaction_id", "reference") ?? request.orderNumber),
    signature: String(getValue(data, "signature", "callback_signature") ?? ""),
    qrImage: typeof getValue(data, "qris_image", "qr_image", "qr_code") === "string" ? String(getValue(data, "qris_image", "qr_image", "qr_code")) : null,
    qrUrl: typeof getValue(data, "qris_url", "qr_url", "payment_url") === "string" ? String(getValue(data, "qris_url", "qr_url", "payment_url")) : null,
    requestedAmount: request.amount,
    uniqueAmount: totalAmount - request.amount,
    totalAmount,
    expiresAt: Number.isNaN(expiresAt.valueOf()) ? new Date(Date.now() + 15 * 60 * 1000) : expiresAt,
    raw,
  };
}

export function normalizeProviderStatus(payload: Record<string, unknown>) {
  const value = String(getValue(payload, "status", "payment_status", "transaction_status") ?? "").toUpperCase();
  if (["PAID", "SUCCESS", "SETTLEMENT", "BERHASIL"].includes(value)) return "PAID";
  if (["EXPIRED", "EXPIRE"].includes(value)) return "EXPIRED";
  if (["FAILED", "FAIL", "CANCELLED", "CANCELED"].includes(value)) return "FAILED";
  return "PENDING";
}
