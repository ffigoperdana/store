"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutForm({ variantId, price, productName, variantName }: { variantId: string; price: number; productName: string; variantName: string }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, buyerName: form.get("buyerName"), buyerWhatsapp: form.get("buyerWhatsapp"), buyerEmail: form.get("buyerEmail") }) });
    const data = await response.json(); if (!response.ok) { setError(data.error || "Checkout gagal."); setBusy(false); return; }
    router.push(`/checkout/${data.publicToken}`);
  }
  return <form className="checkout-form" onSubmit={submit}><p className="checkout-summary"><span>{productName}<small>{variantName}</small></span><strong>Rp{price.toLocaleString("id-ID")}</strong></p><label>Nama lengkap<input name="buyerName" required minLength={2} placeholder="Nama penerima" /></label><label>Nomor WhatsApp<input name="buyerWhatsapp" required minLength={8} inputMode="tel" placeholder="0812…" /></label><label>Email <small>(opsional)</small><input name="buyerEmail" type="email" placeholder="email@kamu.com" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="store-button store-button-primary" disabled={busy}>{busy ? "Membuat tagihan…" : "Lanjut ke pembayaran"}</button><p className="checkout-note">Status pesanan diperbarui dari callback pembayaran. Jangan kirim bukti bayar untuk mengaktifkan akses.</p></form>;
}
