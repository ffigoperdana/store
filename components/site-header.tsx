import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="FG Store, beranda">
          <span className="brand-mark" aria-hidden="true">FG</span>
          <span className="brand-copy">
            <strong>FG STORE</strong>
            <small>digital services</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          <Link href="/#catalog">Layanan</Link>
          <Link href="/redeem-gpt#tutorial">Dokumentasi</Link>
          <Link href="/2fa">2FA Generator</Link>
          <span className="nav-status"><i aria-hidden="true" /> Store aktif</span>
        </nav>

        <details className="mobile-nav">
          <summary aria-label="Buka menu navigasi">Menu</summary>
          <nav aria-label="Navigasi seluler">
            <Link href="/">Beranda</Link>
            <Link href="/#catalog">Layanan</Link>
            <Link href="/redeem-gpt#tutorial">Dokumentasi</Link>
            <Link href="/2fa">2FA Generator</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
