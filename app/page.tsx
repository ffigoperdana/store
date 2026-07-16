import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Layanan Digital",
  description:
    "Dashboard layanan digital FG Store. Temukan produk, panduan, dan fitur keamanan dalam satu tempat.",
};

const products = [
  {
    category: "AI & Produktivitas",
    title: "ChatGPT Plus",
    description: "Panduan redeem dan pengamanan akun untuk pelanggan GPT Plus.",
    status: "Tersedia",
    statusClass: "ready",
    href: "/redeem-gpt#tutorial",
    action: "Lihat panduan",
    icon: "✦",
    accent: "cyan",
  },
  {
    category: "Keamanan",
    title: "2FA Code Generator",
    description: "Generator kode TOTP privat yang berjalan langsung di perangkatmu.",
    status: "Tersedia",
    statusClass: "ready",
    href: "/2fa",
    action: "Buka generator",
    icon: "⌘",
    accent: "violet",
  },
  {
    category: "Streaming",
    title: "Entertainment Hub",
    description: "Ruang untuk layanan hiburan digital FG Store berikutnya.",
    status: "Segera hadir",
    statusClass: "upcoming",
    href: "#updates",
    action: "Ikuti update",
    icon: "◉",
    accent: "pink",
  },
  {
    category: "Tools & Utility",
    title: "Digital Essentials",
    description: "Kategori baru untuk kebutuhan tools dan produktivitas digital.",
    status: "Segera hadir",
    statusClass: "upcoming",
    href: "#updates",
    action: "Lihat roadmap",
    icon: "↗",
    accent: "amber",
  },
];

const advantages = [
  ["01", "Mobile-first", "Nyaman digunakan dari layar kecil sampai desktop."],
  ["02", "Jelas & terarah", "Status layanan dan akses panduan selalu terlihat."],
  ["03", "Privasi diutamakan", "Tool 2FA memproses secret secara lokal di browser."],
];

export default function Home() {
  return (
    <div className="site-shell dashboard-shell">
      <SiteHeader />
      <main id="main-content">
        <section className="store-hero" aria-labelledby="store-title">
          <div className="store-grid" aria-hidden="true" />
          <div className="store-orb store-orb-one" aria-hidden="true" />
          <div className="store-orb store-orb-two" aria-hidden="true" />

          <div className="store-container store-hero-layout">
            <div className="store-copy">
              <p className="store-kicker"><span aria-hidden="true" /> FG STORE / DIGITAL HUB</p>
              <h1 id="store-title">Semua layanan digital,<br /><em>satu tempat.</em></h1>
              <p className="store-lead">
                Dashboard FG Store untuk menemukan produk, mengakses panduan,
                dan mengelola kebutuhan digitalmu dengan lebih mudah.
              </p>
              <div className="store-actions">
                <a className="store-button store-button-primary" href="#catalog">Jelajahi layanan <span aria-hidden="true">→</span></a>
                <Link className="store-button store-button-secondary" href="/redeem-gpt#tutorial">Panduan GPT</Link>
              </div>
            </div>

            <aside className="store-console" aria-label="Ringkasan layanan FG Store">
              <div className="console-top"><span className="console-dots" aria-hidden="true"><i /><i /><i /></span><span>fg-store / overview</span><b>LIVE</b></div>
              <div className="console-content">
                <p>LAYANAN AKTIF</p>
                <strong>02<span>/04</span></strong>
                <div className="console-bar" aria-label="Dua dari empat kategori siap"><i /></div>
                <div className="console-list">
                  <span><i className="active" />GPT &amp; Security <b>Aktif</b></span>
                  <span><i />Kategori baru <b>Dalam persiapan</b></span>
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
              <p>Mulai dari layanan yang sudah siap. Kategori baru akan muncul di dashboard ini tanpa perlu alamat khusus.</p>
            </div>

            <div className="category-row" aria-label="Kategori layanan">
              <a href="#catalog" className="category-chip active">Semua <b>4</b></a>
              <a href="#catalog">AI &amp; Produktivitas</a>
              <a href="#catalog">Keamanan</a>
              <a href="#updates">Segera hadir</a>
            </div>

            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.title}>
                  <div className="product-card-top">
                    <span className={`product-icon ${product.accent}`} aria-hidden="true">{product.icon}</span>
                    <span className={`availability ${product.statusClass}`}><i aria-hidden="true" />{product.status}</span>
                  </div>
                  <p className="product-category">{product.category}</p>
                  <h3>{product.title}</h3>
                  <p className="product-description">{product.description}</p>
                  <Link className="product-link" href={product.href}>{product.action} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-lower" id="updates" aria-labelledby="updates-title">
          <div className="store-container lower-grid">
            <div className="update-card">
              <p className="eyebrow">FG Store update</p>
              <h2 id="updates-title">Dashboard ini akan terus bertumbuh.</h2>
              <p>Produk baru akan ditambahkan ke katalog utama agar semua layanan tetap mudah ditemukan dari beranda.</p>
              <span className="update-note"><i aria-hidden="true" /> Saat ini: Docs GPT &amp; 2FA aktif</span>
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
    </div>
  );
}
