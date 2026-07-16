import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="offline-page" id="main-content">
      <div className="offline-glow" aria-hidden="true" />
      <section className="offline-card">
        <span className="offline-pulse" aria-hidden="true" />
        <p className="eyebrow">FG Store</p>
        <h1>Koneksi internet terputus.</h1>
        <p>
          Halaman yang pernah kamu buka mungkin tetap tersedia. Sambungkan
          internet, lalu coba kembali.
        </p>
        <Link className="button button-primary" href="/">
          Coba lagi <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
