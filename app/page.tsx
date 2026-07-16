import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Under Development",
  description:
    "FG Store sedang dikembangkan. Dokumentasi redeem GPT dan generator 2FA sudah dapat digunakan.",
};

const readyFeatures = [
  {
    eyebrow: "Panduan lengkap",
    title: "Redeem GPT Plus",
    description:
      "Ikuti alur redeem, pengamanan email Microsoft, dan aktivasi keamanan ChatGPT langkah demi langkah.",
    href: "/redeem-gpt#tutorial",
    action: "Buka dokumentasi",
    index: "01",
  },
  {
    eyebrow: "Berjalan di perangkatmu",
    title: "2FA Code Generator",
    description:
      "Buat kode autentikasi enam digit secara lokal. Secret tidak disimpan atau dikirim ke server.",
    href: "/2fa",
    action: "Buka alat 2FA",
    index: "02",
  },
];

export default function Home() {
  return (
    <div className="site-shell landing-shell">
      <SiteHeader />
      <main id="main-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
          <div className="ambient-orb ambient-orb-two" aria-hidden="true" />
          <div className="landing-grid" aria-hidden="true" />

          <div className="landing-copy">
            <p className="status-pill">
              <span className="status-dot" aria-hidden="true" />
              Sedang kami bangun
            </p>
            <h1 id="landing-title">
              Under
              <span>development.</span>
            </h1>
            <p className="landing-lead">
              Store utamanya masih diracik. Sambil menunggu, dokumentasi redeem
              dan generator 2FA sudah siap dipakai.
            </p>
            <div className="landing-actions">
              <Link className="button button-primary" href="/redeem-gpt#tutorial">
                Mulai dari panduan <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-ghost" href="/2fa">
                Buka 2FA
              </Link>
            </div>
          </div>

          <div className="landing-visual" aria-label="Status pengembangan FG Store">
            <div className="orbit orbit-outer" aria-hidden="true" />
            <div className="orbit orbit-inner" aria-hidden="true" />
            <div className="build-core">
              <span className="build-core-label">BUILD</span>
              <strong>01</strong>
              <span>Docs + 2FA</span>
            </div>
            <div className="orbit-note orbit-note-top">PWA ready</div>
            <div className="orbit-note orbit-note-bottom">Mobile first</div>
          </div>
        </section>

        <section className="ready-section" aria-labelledby="ready-title">
          <div className="section-heading section-heading-split">
            <div>
              <p className="eyebrow">Yang sudah bisa digunakan</p>
              <h2 id="ready-title">Dua fitur pertama sudah online.</h2>
            </div>
            <p>
              Dibuat ringan, responsif, bisa dipasang sebagai aplikasi, dan tetap
              berguna saat koneksi tidak stabil setelah kunjungan pertama.
            </p>
          </div>

          <div className="ready-grid">
            {readyFeatures.map((feature) => (
              <Link className="feature-card" href={feature.href} key={feature.href}>
                <div className="feature-card-top">
                  <span className="feature-index">{feature.index}</span>
                  <span className="feature-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="feature-eyebrow">{feature.eyebrow}</p>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-action">{feature.action}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
