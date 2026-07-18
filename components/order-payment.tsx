"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type OrderData = {
  order: {
    number: string;
    status: string;
    buyerEmail: string | null;
    totalAmount: number;
    expiresAt: string;
    whatsappUrl: string | null;
    emailDeliveryStatus: string;
  };
  payment: { status: string; provider: string; qrImage: string | null; qrUrl: string | null; totalAmount: number } | null;
  items: Array<{ productName: string; variantName: string; fulfillmentMode: string }>;
  delivery: Array<{ label: string; value: string; kind: "url" | "code" }>;
};

const emailLabels: Record<string, string> = {
  PENDING: "Email sedang disiapkan",
  SENDING: "Email sedang dikirim",
  SENT: "Akses sudah dikirim ke email",
  FAILED: "Email belum berhasil dikirim—akses tetap tersedia di halaman ini",
  SKIPPED: "Email tidak dikirim",
};

export function OrderPayment({ token }: { token: string }) {
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/orders/${token}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) setError(json.error || "Pesanan tidak ditemukan.");
    else setData(json);
  }, [token]);

  const paymentStatus = data?.payment?.status;
  const emailStatus = data?.order.emailDeliveryStatus;
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const shouldPoll = !paymentStatus || paymentStatus === "PENDING" || ["PENDING", "SENDING"].includes(emailStatus || "");
    const timer = shouldPoll ? window.setInterval(() => void load(), 5000) : undefined;
    return () => {
      window.clearTimeout(initialLoad);
      if (timer) window.clearInterval(timer);
    };
  }, [load, paymentStatus, emailStatus]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="loading-copy">Memuat pesanan aman…</p>;

  const paid = data.payment?.status === "PAID";
  const terminalFailure = ["EXPIRED", "FAILED", "AMOUNT_MISMATCH"].includes(data.payment?.status || "");
  const manual = data.items.some((item) => item.fulfillmentMode === "MANUAL_WHATSAPP");

  async function mockPay() {
    setBusy(true);
    await fetch(`/api/dev/orders/${token}/pay`, { method: "POST" });
    await load();
    setBusy(false);
  }

  return <section className="payment-card">
    <p className="eyebrow">ORDER {data.order.number}</p>
    <h1>{paid ? "Pembayaran terverifikasi" : terminalFailure ? "Pembayaran belum dapat diproses" : "Selesaikan pembayaran"}</h1>
    <p>{data.items.map((item) => `${item.productName} — ${item.variantName}`).join(", ")}</p>
    <div className="payment-total"><span>Total tagihan</span><strong>Rp{(data.payment?.totalAmount || data.order.totalAmount).toLocaleString("id-ID")}</strong></div>

    {!paid && !terminalFailure && <>
      <div className="qris-placeholder">{data.payment?.qrImage ? <Image src={data.payment.qrImage} alt="Kode QR pembayaran" width={320} height={320} unoptimized /> : <><span>QRIS</span><small>Tagihan dibuat. Provider payment akan menampilkan QR di sini.</small></>}</div>
      {data.payment?.qrUrl && <a className="store-button store-button-secondary" href={data.payment.qrUrl} target="_blank" rel="noreferrer">Buka QR pembayaran</a>}
      {process.env.NODE_ENV !== "production" && data.payment?.provider === "mock" && <button className="store-button store-button-primary" onClick={() => void mockPay()} disabled={busy}>{busy ? "Memproses…" : "Simulasikan callback pembayaran"}</button>}
      <p className="checkout-note">Akses dan tombol WhatsApp baru dibuka setelah gateway mengirim callback sukses.</p>
    </>}

    {terminalFailure && <div className="payment-warning">{data.payment?.status === "EXPIRED" ? "Tagihan sudah kedaluwarsa. Silakan kembali ke katalog dan buat pesanan baru." : data.payment?.status === "AMOUNT_MISMATCH" ? "Nominal callback tidak sesuai. Pesanan masuk pemeriksaan admin dan akses belum dibuka." : "Pembayaran gagal diproses. Silakan buat pesanan baru atau hubungi admin."}</div>}

    {paid && <>
      <div className="payment-success">✓ Pembayaran sukses. {data.delivery.length ? "Akses digitalmu sudah siap." : manual ? "Lanjutkan ke WhatsApp agar admin mengirim kode atau URL." : "Pesanan sedang disiapkan."}</div>
      {data.order.buyerEmail && <div className={`delivery-email-status status-${data.order.emailDeliveryStatus.toLowerCase()}`}><span>Email</span><strong>{emailLabels[data.order.emailDeliveryStatus] || data.order.emailDeliveryStatus}</strong><small>{data.order.buyerEmail}</small></div>}
      {data.delivery.map((delivery) => <div className="delivery-value" key={`${delivery.label}-${delivery.value}`}>
        <span>{delivery.label}</span>
        {delivery.kind === "url" ? <a href={delivery.value} target="_blank" rel="noreferrer">{delivery.value}</a> : <code>{delivery.value}</code>}
        <button onClick={() => navigator.clipboard.writeText(delivery.value)}>Salin</button>
      </div>)}
      {data.order.whatsappUrl && <a className="whatsapp-button" href={data.order.whatsappUrl} target="_blank" rel="noreferrer">Hubungi Admin untuk Pengiriman</a>}
    </>}
  </section>;
}
