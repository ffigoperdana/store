import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="footer-brand">FG STORE</span>
          <p>Dokumentasi yang jelas. Alat keamanan yang tetap privat.</p>
        </div>
        <nav aria-label="Navigasi footer">
          <Link href="/redeem-gpt#tutorial">Panduan</Link>
          <Link href="/2fa">2FA</Link>
          <Link href="/">Status</Link>
        </nav>
        <p className="footer-note">© {new Date().getFullYear()} FGDEV</p>
      </div>
    </footer>
  );
}
