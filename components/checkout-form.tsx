"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserCheckoutKey } from "@/lib/browser-checkout";

type CheckoutFormProps = {
  variantId: string;
  price: number;
  productName: string;
  variantName: string;
  requireEmail?: boolean;
};

export function CheckoutForm({ variantId, price, productName, variantName, requireEmail = false }: CheckoutFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const checkoutKey = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const checkActiveCheckout = async () => {
      try {
        const browserKey = getBrowserCheckoutKey();
        const response = await fetch(`/api/checkout/active?browserKey=${encodeURIComponent(browserKey)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (response.ok) setActiveToken(data.active?.token || null);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setActiveToken(null);
      } finally {
        if (!controller.signal.aborted) setCheckingActive(false);
      }
    };
    void checkActiveCheckout();
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    checkoutKey.current ||= window.crypto.randomUUID();
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        checkoutKey: checkoutKey.current,
        browserKey: getBrowserCheckoutKey(),
        variantId,
        buyerName: form.get("buyerName"),
        buyerWhatsapp: form.get("buyerWhatsapp"),
        buyerEmail: form.get("buyerEmail"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      checkoutKey.current = null;
      if (response.status === 409 && data.activeToken) {
        router.push(`/checkout/${data.activeToken}`);
        return;
      }
      setError(data.error || "Checkout gagal.");
      setBusy(false);
      return;
    }
    router.push(`/checkout/${data.publicToken}`);
  }

  return <form className="checkout-form" onSubmit={submit}>
    <p className="checkout-summary"><span>{productName}<small>{variantName}</small></span><strong>Rp{price.toLocaleString("id-ID")}</strong></p>
    <label>Nama lengkap<input name="buyerName" required minLength={2} placeholder="Nama penerima" /></label>
    <label>Nomor WhatsApp<input name="buyerWhatsapp" required minLength={8} inputMode="tel" placeholder="0812…" /></label>
    <label>Email <small>{requireEmail ? "(wajib untuk delivery)" : "(opsional)"}</small><input name="buyerEmail" type="email" required={requireEmail} placeholder="email@kamu.com" /></label>
    {requireEmail && <p className="checkout-field-note">Akses akan tampil di halaman pesanan dan dikirim ke email ini setelah pembayaran terverifikasi.</p>}
    {activeToken && <div className="active-checkout-notice"><strong>Pembayaran aktif masih menunggu.</strong><span>Selesaikan atau tunggu tagihan sebelumnya berakhir sebelum memesan produk lain.</span><button type="button" onClick={() => router.push(`/checkout/${activeToken}`)}>Lanjutkan pembayaran aktif →</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="store-button store-button-primary" disabled={busy || checkingActive || Boolean(activeToken)}>{busy ? "Membuat tagihan…" : checkingActive ? "Memeriksa pembayaran aktif…" : activeToken ? "Selesaikan pembayaran aktif dulu" : "Lanjut ke pembayaran"}</button>
    <p className="checkout-note">Status pesanan diperbarui dari callback pembayaran. Jangan kirim bukti bayar untuk mengaktifkan akses.</p>
  </form>;
}
