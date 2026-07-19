"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getBrowserCheckoutKey } from "@/lib/browser-checkout";

type OrderData = {
  order: { number: string; status: string; buyerEmail: string | null; totalAmount: number; expiresAt: string; whatsappUrl: string | null; emailDeliveryStatus: string; canCancel: boolean; cancellationsRemaining: number };
  payment: { status: string; provider: string; qrImage: string | null; qrUrl: string | null; totalAmount: number } | null;
  items: Array<{ productName: string; variantName: string; fulfillmentMode: string }>;
  delivery: Array<{ label: string; value: string; kind: "url" | "code" }>;
};

const emailLabels: Record<string, string> = {
  PENDING: "Email sedang disiapkan", SENDING: "Email sedang dikirim", SENT: "Akses sudah dikirim ke email",
  FAILED: "Email belum berhasil dikirim—akses tetap tersedia di halaman ini", SKIPPED: "Email tidak dikirim",
};

function remainingLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function OrderPayment({ token }: { token: string }) {
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [returnSeconds, setReturnSeconds] = useState(30);
  const [cancelBusy, setCancelBusy] = useState(false);
  const load = useCallback(async () => {
    const browserKey = getBrowserCheckoutKey();
    const response = await fetch(`/api/orders/${token}?browserKey=${encodeURIComponent(browserKey)}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) setError(json.error || "Pesanan tidak ditemukan.");
    else setData(json);
  }, [token]);

  const paymentStatus = data?.payment?.status;
  const emailStatus = data?.order.emailDeliveryStatus;
  const paid = paymentStatus === "PAID";
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const shouldPoll = !paymentStatus || paymentStatus === "PENDING" || ["PENDING", "SENDING"].includes(emailStatus || "");
    const timer = shouldPoll ? window.setInterval(() => void load(), 5000) : undefined;
    return () => { window.clearTimeout(initialLoad); if (timer) window.clearInterval(timer); };
  }, [load, paymentStatus, emailStatus]);
  useEffect(() => {
    if (paid) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [paid]);
  useEffect(() => {
    if (!paid || returnSeconds <= 0) return;
    const timer = window.setTimeout(() => setReturnSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [paid, returnSeconds]);
  useEffect(() => { if (paid && returnSeconds === 0) window.location.assign("/"); }, [paid, returnSeconds]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="loading-copy">Memuat pesanan aman…</p>;

  const expiresAt = new Date(data.order.expiresAt).getTime();
  const secondsRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const timedOut = !paid && secondsRemaining === 0;
  const terminalFailure = timedOut || ["EXPIRED", "FAILED", "AMOUNT_MISMATCH"].includes(paymentStatus || "");
  const manual = data.items.some((item) => item.fulfillmentMode === "MANUAL_WHATSAPP");
  const automatic = data.items.some((item) => item.fulfillmentMode !== "MANUAL_WHATSAPP");
  const pendingNote = automatic && !manual
    ? "Akses digital akan tampil di halaman ini dan dikirim ke email setelah gateway mengirim callback sukses."
    : manual && !automatic
      ? "Tombol WhatsApp untuk menghubungi admin baru dibuka setelah gateway mengirim callback sukses."
      : "Akses digital dan tombol WhatsApp (bila diperlukan) baru dibuka setelah gateway mengirim callback sukses.";

  async function mockPay() {
    setBusy(true); await fetch(`/api/dev/orders/${token}/pay`, { method: "POST" }); await load(); setBusy(false);
  }

  async function cancelPayment() {
    setCancelBusy(true);
    setError("");
    const response = await fetch(`/api/orders/${token}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ browserKey: getBrowserCheckoutKey() }),
    });
    const json = await response.json();
    if (!response.ok) setError(json.error || "Pembatalan tidak dapat diproses.");
    else window.location.assign("/");
    setCancelBusy(false);
  }

  return <section className="payment-card">
    <p className="eyebrow">ORDER {data.order.number}</p>
    <h1>{paid ? "Pembayaran terverifikasi" : terminalFailure ? "Pembayaran belum dapat diproses" : "Selesaikan pembayaran"}</h1>
    <p>{data.items.map((item) => `${item.productName} — ${item.variantName}`).join(", ")}</p>
    <div className="payment-total"><span>Total tagihan</span><strong>Rp{(data.payment?.totalAmount || data.order.totalAmount).toLocaleString("id-ID")}</strong></div>

    {!paid && !terminalFailure && <>
      <div className="payment-countdown" aria-live="polite"><span>Tagihan aktif</span><strong key={secondsRemaining}>{remainingLabel(secondsRemaining)}</strong><small>Bayar sebelum waktu habis. Status diperbarui otomatis setelah callback gateway diterima.</small></div>
      <div className="qris-placeholder">{data.payment?.qrImage ? <Image src={data.payment.qrImage} alt="Kode QR pembayaran" width={320} height={320} unoptimized /> : <><span>QRIS</span><small>Tagihan dibuat. Provider payment akan menampilkan QR di sini.</small></>}</div>
      {data.payment?.qrUrl && <a className="store-button store-button-secondary" href={data.payment.qrUrl} target="_blank" rel="noreferrer">Buka QR pembayaran</a>}
      {process.env.NODE_ENV !== "production" && data.payment?.provider === "mock" && <button className="store-button store-button-primary" onClick={() => void mockPay()} disabled={busy}>{busy ? "Memproses…" : "Simulasikan callback pembayaran"}</button>}
      <p className="checkout-note">{pendingNote}</p>
      <div className="payment-pending-actions">
        <Link className="checkout-home-link" href="/">← Kembali ke beranda</Link>
        {data.order.canCancel ? <button className="payment-cancel" onClick={() => void cancelPayment()} disabled={cancelBusy}>{cancelBusy ? "Membatalkan…" : `Batalkan pembayaran (${data.order.cancellationsRemaining}x tersisa)`}</button> : <small>Pembatalan dari browser ini sudah mencapai batas. Tunggu tagihan gateway berakhir otomatis.</small>}
      </div>
    </>}

    {terminalFailure && <><div className="payment-warning">{timedOut || paymentStatus === "EXPIRED" ? "Tagihan sudah kedaluwarsa. Silakan kembali ke katalog dan buat pesanan baru." : paymentStatus === "AMOUNT_MISMATCH" ? "Nominal callback tidak sesuai. Pesanan masuk pemeriksaan admin dan akses belum dibuka." : "Pembayaran gagal diproses. Silakan buat pesanan baru atau hubungi admin."}</div><Link className="store-button store-button-secondary" href="/">Kembali ke beranda</Link></>}

    {paid && <>
      <div className="payment-success">✓ Pembayaran sukses. {data.delivery.length ? "Akses digitalmu sudah siap." : manual ? "Lanjutkan ke WhatsApp agar admin mengirim kode atau URL." : "Pesanan sedang disiapkan."}</div>
      {data.order.buyerEmail && <div className={`delivery-email-status status-${data.order.emailDeliveryStatus.toLowerCase()}`}><span>Email</span><strong>{emailLabels[data.order.emailDeliveryStatus] || data.order.emailDeliveryStatus}</strong><small>{data.order.buyerEmail}</small></div>}
      {data.delivery.map((delivery) => <div className="delivery-value" key={`${delivery.label}-${delivery.value}`}><span>{delivery.label}</span>{delivery.kind === "url" ? <a href={delivery.value} target="_blank" rel="noreferrer">{delivery.value}</a> : <code>{delivery.value}</code>}<button onClick={() => navigator.clipboard.writeText(delivery.value)}>Salin</button></div>)}
      {data.order.whatsappUrl && <a className="whatsapp-button" href={data.order.whatsappUrl} target="_blank" rel="noreferrer">Hubungi Admin untuk Pengiriman</a>}
      <div className="payment-return"><span>Kembali ke beranda otomatis dalam <strong>{returnSeconds} dtk</strong></span><Link className="store-button store-button-secondary" href="/">Kembali ke beranda sekarang</Link></div>
    </>}
  </section>;
}
