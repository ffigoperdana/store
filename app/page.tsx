import type { Metadata } from "next";
import Link from "next/link";
import { CatalogBrowser } from "@/components/catalog-browser";
import { FloatingPaymentAction } from "@/components/floating-payment-action";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicCatalog, getPublicCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Layanan Digital",
  description:
    "Katalog layanan digital FG Store. Temukan produk, paket, panduan, dan fitur keamanan dalam satu tempat.",
};

const advantages = [
  ["01", "Mobile-first", "Nyaman digunakan dari layar kecil sampai desktop."],
  ["02", "Jelas & terarah", "Status produk dan akses panduan selalu terlihat."],
  ["03", "Privasi diutamakan", "Tool 2FA memproses secret secara lokal di browser."],
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [catalogProducts, categories] = await Promise.all([
    getPublicCatalog(),
    getPublicCategories(),
  ]);
  const visibleProducts = catalogProducts.filter((product) => product.variants.length > 0);
  const availableProducts = visibleProducts.filter((product) =>
    product.variants.some((variant) => variant.available),
  );
  const totalVariants = visibleProducts.reduce(
    (total, product) => total + product.variants.length,
    0,
  );
  const availabilityPercent = visibleProducts.length
    ? Math.round((availableProducts.length / visibleProducts.length) * 100)
    : 0;
  const categorySummaries = categories.map((category) => ({
    ...category,
    productCount: visibleProducts.filter(
      (product) => product.categorySlug === category.slug,
    ).length,
  }));

  return (
    <div className="site-shell dashboard-shell">
      <SiteHeader />
      <main id="main-content">
        <section className="store-hero" aria-labelledby="store-title">
          <div className="store-grid" aria-hidden="true" />
          <div className="store-orb store-orb-one" aria-hidden="true" />
          <div className="store-orb store-orb-two" aria-hidden="true" />
          <div className="kinetic-ribbons" aria-hidden="true"><i /><i /><i /></div>

          <div className="store-container store-hero-layout">
            <div className="store-copy">
              <p className="store-kicker"><span aria-hidden="true" /> FG STORE / DIGITAL HUB</p>
              <h1 id="store-title">Semua layanan digital,<br /><em>satu tempat.</em></h1>
              <p className="store-lead">
                Temukan berbagai produk digital, pilih paket yang sesuai, lalu
                selesaikan pembayaran dalam alur yang ringkas dan transparan.
              </p>
              <div className="store-actions">
                <a className="store-button store-button-primary" href="#catalog">Jelajahi layanan <span aria-hidden="true">→</span></a>
                <Link className="store-button store-button-secondary" href="/2fa">Buka 2FA Generator</Link>
              </div>
            </div>

            <aside className="store-console" aria-label="Ringkasan katalog FG Store">
              <div className="console-top">
                <span className="console-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>fg-store / catalog</span>
                <b>LIVE</b>
              </div>
              <div className="console-content">
                <p>RINGKASAN KATALOG</p>
                <strong>{String(visibleProducts.length).padStart(2, "0")}<span> produk</span></strong>
                <div className="console-metrics" aria-label="Statistik katalog saat ini">
                  <span><b>{categories.length}</b>Kategori</span>
                  <span><b>{totalVariants}</b>Pilihan paket</span>
                  <span><b>{availableProducts.length}</b>Siap dibeli</span>
                </div>
                <div className="console-bar" aria-label={`${availabilityPercent}% produk tersedia`}>
                  <i style={{ width: `${availabilityPercent}%` }} />
                </div>
                <div className="console-list">
                  {categorySummaries.slice(0, 3).map((category) => (
                    <span key={category.id}>
                      <i className={category.productCount ? "active" : undefined} />
                      {category.name}
                      <b>{category.productCount} produk</b>
                    </span>
                  ))}
                  {!categorySummaries.length && (
                    <span><i />Katalog belum tersedia <b>Menunggu data</b></span>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="catalog-section" id="catalog" aria-labelledby="catalog-title">
          <div className="store-container">
            <div className="section-heading dashboard-heading">
              <div>
                <p className="eyebrow">Katalog layanan</p>
                <h2 id="catalog-title">Pilih yang kamu butuhkan.</h2>
              </div>
              <p>Kategori dan produk di bawah ini mengikuti data yang kamu kelola dari dashboard admin.</p>
            </div>

            <CatalogBrowser categories={categories} products={visibleProducts} />
          </div>
        </section>

        <section className="dashboard-lower" id="updates" aria-labelledby="updates-title">
          <div className="store-container lower-grid">
            <div className="update-card">
              <p className="eyebrow">FG Store update</p>
              <h2 id="updates-title">Katalog yang mengikuti kebutuhanmu.</h2>
              <p>Produk baru yang dipublikasikan dari admin akan otomatis masuk ke kategori yang tepat di beranda.</p>
              <span className="update-note"><i aria-hidden="true" /> Saat ini: {visibleProducts.length} produk dalam {categories.length} kategori</span>
            </div>
            <div className="advantage-list">
              {advantages.map(([number, title, copy]) => (
                <div className="advantage" key={number}>
                  <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingPaymentAction />
    </div>
  );
}
