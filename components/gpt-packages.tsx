"use client";

import { useEffect, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";

export type GptPackage = {
  product: { name: string; slug: string; shortDescription: string };
  variant: { id: string; sku: string; name: string; price: number; compareAtPrice: number | null; channel: string | null; duration: string | null; warranty: string | null; estimatedProcess: string | null; available: boolean };
};

export function GptPackages({ packages }: { packages: GptPackage[] }) {
  const [selected, setSelected] = useState<GptPackage | null>(null);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);
  return <><div className="gpt-package-grid">{packages.map((entry) => {
    const { product, variant } = entry;
    return <article className={`gpt-package ${variant.available ? "" : "is-sold"}`} key={variant.id}><div className="gpt-package-head"><span className="gpt-code">{variant.sku.slice(0, 4)}</span><div><h3>{variant.name}</h3><p>{variant.channel || product.name}</p></div></div><p className="gpt-price">{variant.compareAtPrice && <del>Rp{variant.compareAtPrice.toLocaleString("id-ID")}</del>}Rp{variant.price.toLocaleString("id-ID")} <small>/ paket</small></p><div className="gpt-package-note">{product.shortDescription}</div><ul><li>Private, akun private sesuai channel</li><li>Durasi: {variant.duration || "Sesuai detail paket"}</li><li>{variant.warranty ? `Garansi: ${variant.warranty}` : "Tanpa garansi setelah akun berhasil masuk"}</li><li>{variant.estimatedProcess || "Status pesanan diperbarui otomatis"}</li></ul><span className={`gpt-availability ${variant.available ? "ready" : "sold"}`}><i /> {variant.available ? "Ready" : "Sold out"}</span>{variant.available ? <button className="gpt-checkout" onClick={() => setSelected(entry)}>Checkout</button> : <button className="gpt-checkout disabled" disabled>Sold out</button>}<a className="gpt-guide" href="/redeem-gpt#tutorial">Panduan redeem & 2FA</a></article>;
  })}</div>{selected && <div className="checkout-modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="checkout-modal-close" onClick={() => setSelected(null)} aria-label="Tutup checkout">×</button><p className="eyebrow">CHECKOUT PAKET</p><h2 id="checkout-modal-title">{selected.variant.name}</h2><p className="checkout-modal-channel">{selected.variant.channel || selected.product.name}</p><CheckoutForm variantId={selected.variant.id} price={selected.variant.price} productName={selected.product.name} variantName={selected.variant.name} /></section></div>}</>;
}
