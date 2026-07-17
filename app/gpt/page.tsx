import Link from "next/link";
import { GptPackages } from "@/components/gpt-packages";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCategoryProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const flow = [["1", "Pilih paket", "Bandingkan channel, durasi, dan ketentuan paket."], ["2", "Checkout", "Isi nama serta WhatsApp untuk status pesanan."], ["3", "Bayar QRIS", "Selesaikan tagihan QRIS dari gateway pembayaran."], ["4", "Akses diterima", "Akses otomatis atau WhatsApp terbuka setelah callback sukses."]];
const faqs = [
  ["Bagaimana cara melihat panduan redeem?", "Setelah memilih paket, gunakan tombol Panduan redeem. Halaman /redeem-gpt#tutorial tetap menjadi panduan utama."],
  ["Kapan tombol WhatsApp aktif?", "Hanya setelah gateway pembayaran mengirim callback sukses dan pesanan berstatus PAID atau FULFILLED."],
  ["Apakah produk ChatGPT memiliki jaminan full durasi?", "Ketentuan garansi dan durasi ditampilkan pada setiap paket. Baca detail paket sebelum checkout."],
];

export default async function GptPage() {
  const products = await getCategoryProducts("chatgpt-plus");
  const variants = products.flatMap((product) => product.variants.map((variant) => ({ product, variant })));
  return <div className="site-shell gpt-shell"><SiteHeader /><main className="gpt-page"><section className="gpt-hero"><p className="store-kicker"><span /> CHATGPT PLUS / FG STORE</p><h1>Pilih paket ChatGPT<br /><em>sesuai kebutuhanmu.</em></h1><p>Setiap paket menampilkan channel, estimasi proses, serta ketentuan sebelum checkout. Panduan redeem tetap tersedia setelah pembelian.</p><div className="gpt-hero-actions"><a className="store-button store-button-primary" href="#paket">Lihat paket</a><Link className="store-button store-button-secondary" href="/redeem-gpt#tutorial">Panduan redeem</Link></div></section>
    <section id="paket" className="gpt-packages"><div className="gpt-section-heading"><div><p className="eyebrow">Katalog ChatGPT Plus</p><h2>Pilih paket yang tersedia.</h2></div><div className="gpt-legend"><span><i className="ready-dot" /> Produk ready</span><span><i className="sold-dot" /> Produk sold out</span></div></div>{variants.length ? <GptPackages packages={variants} /> : <article className="gpt-empty"><h3>Belum ada paket yang dipublikasikan.</h3><p>Admin dapat membuat kategori bernama <code>chatgpt-plus</code>, menautkan produk ke kategori tersebut, lalu publish produk dan varian.</p></article>}</section>
    <section className="gpt-flow"><p className="eyebrow">Cara order</p><h2>Alur pembelian sederhana.</h2><div>{flow.map(([number, title, copy]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="gpt-info"><div className="gpt-info-heading"><p className="eyebrow">Wajib dibaca</p><h2>Cara login, aturan pakai, dan garansi</h2><p>Bagian ini dirangkum agar pembeli memahami proses dan risiko paket sebelum melanjutkan pembayaran.</p></div><div className="gpt-info-grid"><article><p>01 · LOGIN & CEK PAKET</p><h3>Masuk dan pastikan paket aktif</h3><ul><li>Gunakan email dan password yang diberikan admin.</li><li>Jika diminta OTP, gunakan 2FA dari panduan setelah pesanan dikirim.</li><li>Setelah berhasil masuk, cek plan aktif sesuai paket yang dibeli.</li><li><Link href="/redeem-gpt#tutorial">Buka panduan redeem & pengamanan</Link></li></ul></article><article><p>02 · ATURAN PENGGUNAAN</p><h3>Gunakan akun secara wajar</h3><ul><li>Jangan spam fitur atau memakai terlalu banyak perangkat.</li><li>Jangan mengubah billing, profile, password, atau plan bila paket tidak mengizinkan.</li><li>Hindari proxy, router, cookies/token, atau tools pihak ketiga yang melanggar kebijakan layanan.</li></ul></article><article><p>03 · GARANSI</p><h3>Ketentuan garansi paket</h3><ul><li>Durasi dan masa garansi mengikuti detail tiap paket.</li><li>Garansi tidak mencakup masalah dari penggunaan berlebihan atau perubahan akun sendiri.</li><li>Jika ada kendala dalam masa garansi, hubungi admin melalui WhatsApp pesanan.</li></ul></article></div></section>
    <section className="gpt-notice"><h2>Catatan penting sebelum membeli</h2><ul><li>Durasi, channel, dan ketentuan mengikuti detail yang tertulis pada paket.</li><li>Pembayaran dianggap berhasil hanya setelah callback dari gateway diterima.</li><li>Jangan membagikan akses akun atau secret key 2FA kepada pihak lain.</li><li>Jika membutuhkan panduan login dan pengamanan, buka dokumentasi redeem setelah order.</li></ul></section>
    <section className="gpt-faq"><p className="eyebrow">FAQ</p><h2>Pertanyaan yang sering ditanyakan</h2>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
    <section className="gpt-cta"><h2>Sudah siap memilih paket?</h2><p>Pilih paket ChatGPT Plus yang tersedia, lalu lanjutkan checkout aman melalui QRIS.</p><a className="store-button store-button-primary" href="#paket">Lihat katalog</a></section>
  </main><SiteFooter /></div>;
}
