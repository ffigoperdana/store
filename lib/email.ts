import "server-only";

type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

type EmailResult =
  | { status: "sent"; providerId: string | null }
  | { status: "disabled"; providerId: null };

function emailProvider() {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (configured) return configured;
  return process.env.RESEND_API_KEY ? "resend" : "disabled";
}

export function isTransactionalEmailEnabled() {
  return emailProvider() !== "disabled";
}

export async function sendTransactionalEmail(input: TransactionalEmail): Promise<EmailResult> {
  const provider = emailProvider();
  if (provider === "disabled") return { status: "disabled", providerId: null };
  if (provider !== "resend") throw new Error(`EMAIL_PROVIDER ${provider} belum didukung.`);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("RESEND_API_KEY dan EMAIL_FROM wajib diisi untuk pengiriman email.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(process.env.EMAIL_REPLY_TO?.trim() ? { reply_to: process.env.EMAIL_REPLY_TO.trim() } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const data = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
  if (!response.ok) {
    throw new Error(data.message || data.name || `Provider email menolak permintaan (${response.status}).`);
  }
  return { status: "sent", providerId: data.id || null };
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}
