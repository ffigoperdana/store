import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TwoFactorTool } from "@/components/two-factor-tool";

export const metadata: Metadata = {
  title: "2FA Code Generator",
  description:
    "Buat kode TOTP enam digit langsung di browser. Secret key tidak disimpan atau dikirim ke server.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TwoFactorPage() {
  return (
    <div className="site-shell totp-page-shell">
      <SiteHeader />
      <main className="totp-page" id="main-content">
        <div className="totp-grid-backdrop" aria-hidden="true" />
        <div className="ambient-orb totp-orb-one" aria-hidden="true" />
        <div className="ambient-orb totp-orb-two" aria-hidden="true" />

        <div className="totp-page-grid">
          <aside className="totp-intro" aria-labelledby="totp-intro-title">
            <p className="eyebrow">Keamanan tanpa server</p>
            <h2 id="totp-intro-title">
              Kode 2FA dibuat di perangkatmu.
            </h2>
            <p>
              Masukkan secret Base32 dari pengaturan MFA ChatGPT. Perhitungan
              HMAC-SHA1 berlangsung lokal dengan Web Crypto dan tidak pernah
              dikirim ke FG Store.
            </p>

            <ul className="totp-benefit-list">
              <li>
                <span aria-hidden="true">01</span>
                <div>
                  <strong>Privat secara default</strong>
                  <small>Tanpa akun, database, analytics, atau penyimpanan secret.</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <div>
                  <strong>Kompatibel authenticator</strong>
                  <small>TOTP 6 digit, periode 30 detik, HMAC-SHA1.</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">03</span>
                <div>
                  <strong>Bisa dipasang</strong>
                  <small>Gunakan sebagai PWA untuk akses lebih cepat dari ponsel.</small>
                </div>
              </li>
            </ul>

            <div className="totp-intro-note" role="note">
              <span aria-hidden="true">!</span>
              <p>
                Tautan alternatif membawa secret di bagian <code>#key</code>.
                Simpan hanya di password manager dan jangan bagikan.
              </p>
            </div>

            <Link className="text-link" href="/redeem-gpt#step-13">
              Lihat cara menemukan secret key <span aria-hidden="true">→</span>
            </Link>
          </aside>

          <div className="totp-card-wrap">
            <div className="totp-card-glow" aria-hidden="true" />
            <TwoFactorTool />
            <p className="totp-authorized">
              <span aria-hidden="true" /> Local-only security utility
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
