import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProduct } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getPublicProduct(slug); if (!product) notFound();
  return <div className="site-shell"><SiteHeader /><main className="product-page"><section className="product-detail-hero"><p className="eyebrow">FG STORE / DIGITAL PRODUCT</p><h1>{product.name}</h1><p>{product.description || product.shortDescription}</p></section><section className="variant-grid">{product.variants.map((variant) => <article className="variant-card" key={variant.id}><div><span className="product-category">{variant.fulfillmentMode === "MANUAL_WHATSAPP" ? "Manual delivery" : variant.fulfillmentMode === "UNIQUE_POOL" ? "Unique delivery" : "Instant delivery"}</span><h2>{variant.name}</h2><p>{variant.channel || variant.estimatedProcess || "Akses digital"}</p></div><strong>Rp{variant.price.toLocaleString("id-ID")}</strong>{variant.duration && <p className="variant-meta">Durasi: {variant.duration}</p>}{variant.warranty && <p className="variant-meta">Garansi: {variant.warranty}</p>}{variant.available ? <CheckoutForm variantId={variant.id} price={variant.price} productName={product.name} variantName={variant.name} /> : <button className="soldout-button" disabled>Sold out</button>}</article>)}</section></main><SiteFooter /></div>;
}
