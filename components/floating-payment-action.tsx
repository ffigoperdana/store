"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserCheckoutKey } from "@/lib/browser-checkout";

type ActiveCheckout = {
  token: string;
  number: string;
  expiresAt: string;
  productName: string;
  variantName: string;
  cancellationsRemaining: number;
};

function remainingLabel(expiresAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}j ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`
    : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function FloatingPaymentAction() {
  const [active, setActive] = useState<ActiveCheckout | null>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const key = getBrowserCheckoutKey();
    const response = await fetch(`/api/checkout/active?browserKey=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    setActive(json.active || null);
    if (!json.active) setOpen(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 10_000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(timer); };
  }, [load]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initialTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(initialTick); window.clearInterval(timer); };
  }, []);

  async function cancel() {
    if (!active) return;
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/orders/${active.token}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ browserKey: getBrowserCheckoutKey() }),
    });
    const json = await response.json();
    if (!response.ok) setMessage(json.error || "Pembatalan tidak dapat diproses.");
    else await load();
    setBusy(false);
  }

  if (!active) return null;
  return <div className="active-payment-float">
    {open && <aside className="active-payment-panel" aria-label="Pembayaran yang masih aktif">
      <button className="active-payment-item" onClick={() => window.location.assign(`/checkout/${active.token}`)}>
        <span>PEMBAYARAN AKTIF</span>
        <strong>{active.productName}</strong>
        <small>{active.variantName || active.number}</small>
        <b>Berakhir dalam {remainingLabel(active.expiresAt, now)} →</b>
      </button>
      {active.cancellationsRemaining > 0 ? <button className="active-payment-cancel" onClick={() => void cancel()} disabled={busy}>{busy ? "Memproses…" : `Batalkan pembayaran (${active.cancellationsRemaining}x tersisa)`}</button> : <p>Pembatalan sudah mencapai batas. Tunggu tagihan gateway berakhir otomatis.</p>}
      {message && <p className="active-payment-message">{message}</p>}
    </aside>}
    <button className="active-payment-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <i aria-hidden="true" />
      <span>{open ? "Tutup status" : "Pembayaran aktif"}</span>
      <b>{remainingLabel(active.expiresAt, now)}</b>
    </button>
  </div>;
}
