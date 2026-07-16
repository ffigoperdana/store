import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HashScroll } from "@/components/hash-scroll";
import {
  hasTutorialMedia,
  TutorialMedia,
} from "@/components/tutorial-media";

export const metadata: Metadata = {
  title: "Panduan Redeem GPT Plus",
  description:
    "Panduan 16 langkah untuk redeem akun GPT, mengamankan email Microsoft, dan mengaktifkan 2FA dengan aman.",
};

type TutorialStep = {
  number: number;
  title: string;
  description: ReactNode;
  panel?: ReactNode;
  phase: "Redeem" | "Microsoft" | "ChatGPT" | "2FA";
};

const externalLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

const steps: TutorialStep[] = [
  {
    number: 1,
    phase: "Redeem",
    title: "Ambil kode redeem dari admin",
    description: (
      <p>
        Pastikan kamu menerima kode redeem khusus pesananmu dari admin FG Store.
        Jangan memakai kode contoh dari panduan ini.
      </p>
    ),
    panel: (
      <div className="docs-code-panel" aria-label="Contoh format kode redeem">
        <span>Contoh format</span>
        <code>FG-EU-••••••••</code>
      </div>
    ),
  },
  {
    number: 2,
    phase: "Redeem",
    title: "Buka portal redeem",
    description: (
      <p>
        Kunjungi{" "}
        <a href="https://chongzhi.art/" {...externalLinkProps}>
          chongzhi.art
        </a>
        . Jika antarmukanya memakai bahasa Tiongkok, aktifkan terjemahan bawaan
        browser. Pilih inventory <strong>EUR Plus</strong>, masukkan kode redeem,
        pastikan jumlahnya 1, lalu tekan <strong>Redeem</strong>.
      </p>
    ),
    panel: (
      <div className="docs-browser-mock" aria-label="Ilustrasi bilah alamat browser">
        <span className="docs-browser-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>https://chongzhi.art/</span>
        <b>Terjemahkan</b>
      </div>
    ),
  },
  {
    number: 3,
    phase: "Redeem",
    title: "Redeem dan catat akun Microsoft",
    description: (
      <p>
        Masukkan kode, jalankan proses redeem, lalu catat alamat Hotmail atau
        Outlook beserta kata sandi yang ditampilkan. Simpan sementara di tempat
        privat—jangan kirim ke grup atau orang lain.
      </p>
    ),
    panel: (
      <div className="docs-credential-mock" aria-label="Ilustrasi data akun hasil redeem">
        <div>
          <span>Email Microsoft</span>
          <strong>user•••@outlook.com</strong>
        </div>
        <div>
          <span>Kata sandi awal</span>
          <strong>••••••••••••</strong>
        </div>
      </div>
    ),
  },
  {
    number: 4,
    phase: "Microsoft",
    title: "Mulai pengamanan email",
    description: (
      <p>
        Begitu kredensial diterima, prioritaskan dua hal: pasang email pemulihan
        milikmu sendiri dan ganti kata sandi awal akun Microsoft.
      </p>
    ),
    panel: (
      <ul className="docs-mini-checklist" aria-label="Prioritas pengamanan email">
        <li>Email pemulihan pribadi</li>
        <li>Kata sandi baru yang unik</li>
      </ul>
    ),
  },
  {
    number: 5,
    phase: "Microsoft",
    title: "Masuk ke inbox Outlook",
    description: (
      <p>
        Buka{" "}
        <a href="https://outlook.office.com/mail/inbox" {...externalLinkProps}>
          Outlook Web
        </a>{" "}
        dan login memakai email serta kata sandi hasil redeem. Periksa kembali
        domain email sebelum menekan tombol masuk.
      </p>
    ),
    panel: (
      <div className="docs-action-panel">
        <span>Tujuan aman</span>
        <strong>outlook.office.com</strong>
      </div>
    ),
  },
  {
    number: 6,
    phase: "Microsoft",
    title: "Tambahkan email pemulihan",
    description: (
      <p>
        Gunakan Gmail atau alamat email aktif lain yang benar-benar kamu kuasai.
        Alamat ini dipakai Microsoft untuk verifikasi tambahan dan pemulihan
        akun bila akses bermasalah.
      </p>
    ),
    panel: (
      <div className="docs-flow-line" aria-label="Alur penambahan email pemulihan">
        <span>Akun Microsoft</span>
        <i aria-hidden="true">→</i>
        <span>Email pribadimu</span>
      </div>
    ),
  },
  {
    number: 7,
    phase: "Microsoft",
    title: "Verifikasi kode dari Microsoft",
    description: (
      <p>
        Cek inbox email pemulihan, temukan pesan verifikasi Microsoft, lalu
        masukkan enam digit yang diterima. Jangan pernah membagikan kode tersebut
        kepada pihak yang tidak kamu kenal.
      </p>
    ),
    panel: (
      <div className="docs-otp-mock" aria-label="Ilustrasi kode verifikasi enam digit">
        <span>4</span>
        <span>8</span>
        <span>2</span>
        <span>7</span>
        <span>1</span>
        <span>9</span>
        <small>Ilustrasi—gunakan kode dari inbox kamu</small>
      </div>
    ),
  },
  {
    number: 8,
    phase: "Microsoft",
    title: "Ubah bahasa Outlook ke Indonesia",
    description: (
      <p>
        Setelah inbox terbuka, pilih ikon Settings, buka General lalu Language &amp;
        time, pilih <strong>Indonesia (Indonesia)</strong>, dan tekan Save. Zona
        waktu dapat disesuaikan dari halaman yang sama bila diperlukan.
      </p>
    ),
    panel: (
      <div className="docs-settings-path" aria-label="Jalur menu pengaturan bahasa Outlook">
        <span>Settings</span>
        <i aria-hidden="true">›</i>
        <span>General</span>
        <i aria-hidden="true">›</i>
        <span>Language &amp; time</span>
      </div>
    ),
  },
  {
    number: 9,
    phase: "Microsoft",
    title: "Ganti kata sandi Microsoft",
    description: (
      <p>
        Buka{" "}
        <a href="https://account.live.com/password/Change" {...externalLinkProps}>
          halaman perubahan kata sandi Microsoft
        </a>
        , buat kata sandi panjang dan unik, lalu selesaikan verifikasi melalui
        email pemulihan jika diminta.
      </p>
    ),
    panel: (
      <div className="docs-password-meter" aria-label="Saran kata sandi kuat">
        <span>Kata sandi unik</span>
        <span className="docs-password-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>Kuat</strong>
      </div>
    ),
  },
  {
    number: 10,
    phase: "Microsoft",
    title: "Pastikan email sudah aman",
    description: (
      <p>
        Sebelum pindah ke ChatGPT, pastikan kamu bisa login ulang dengan kata
        sandi baru dan email pemulihan sudah tercatat. Simpan detail pemulihan di
        password manager atau catatan terenkripsi.
      </p>
    ),
    panel: (
      <ul className="docs-status-list" aria-label="Pemeriksaan keamanan akun Microsoft">
        <li><span aria-hidden="true">✓</span>Kata sandi awal sudah diganti</li>
        <li><span aria-hidden="true">✓</span>Email pemulihan sudah terverifikasi</li>
      </ul>
    ),
  },
  {
    number: 11,
    phase: "ChatGPT",
    title: "Login ke ChatGPT",
    description: (
      <p>
        Masuk ke ChatGPT menggunakan alamat Microsoft tadi. Bila muncul
        verifikasi email, kembali ke inbox Outlook, ambil kode enam digit terbaru,
        lalu tuntaskan proses login.
      </p>
    ),
    panel: (
      <div className="docs-mail-mock" aria-label="Ilustrasi pesan kode login ChatGPT">
        <span className="docs-mail-icon" aria-hidden="true">@</span>
        <div>
          <strong>Kode login ChatGPT</strong>
          <span>Pesan baru di inbox Microsoft</span>
        </div>
      </div>
    ),
  },
  {
    number: 12,
    phase: "ChatGPT",
    title: "Aktifkan keamanan ChatGPT",
    description: (
      <p>
        Dari pengaturan akun ChatGPT, perbarui kata sandi bila opsinya tersedia,
        lalu buka bagian keamanan untuk mengaktifkan multi-factor authentication
        (MFA).
      </p>
    ),
    panel: (
      <div className="docs-settings-path" aria-label="Jalur menu MFA ChatGPT">
        <span>Settings</span>
        <i aria-hidden="true">›</i>
        <span>Security</span>
        <i aria-hidden="true">›</i>
        <span>MFA</span>
      </div>
    ),
  },
  {
    number: 13,
    phase: "ChatGPT",
    title: "Tampilkan secret key manual",
    description: (
      <p>
        Pada layar QR MFA, pilih opsi seperti <q>can&apos;t scan the QR code</q>
        untuk menampilkan secret key manual sepanjang 32 karakter. Anggap kunci
        ini setara dengan kata sandi—siapa pun yang memilikinya dapat membuat kode
        2FA.
      </p>
    ),
    panel: (
      <div className="docs-secret-panel" aria-label="Ilustrasi secret key manual">
        <span>Secret key manual</span>
        <code>•••• •••• •••• •••• •••• •••• •••• ••••</code>
        <small>Jangan bagikan atau ambil screenshot kunci asli</small>
      </div>
    ),
  },
  {
    number: 14,
    phase: "2FA",
    title: "Buat kode lewat 2FA FG Store",
    description: (
      <p>
        Buka generator 2FA FG Store, tempel secret key manual, lalu salin kode
        enam digit yang aktif. Kembali ke ChatGPT dan masukkan kode itu untuk
        menyelesaikan aktivasi MFA.
      </p>
    ),
    panel: (
      <Link className="docs-inline-cta" href="/2fa">
        <span>
          <small>Tool lokal di browser</small>
          Buka 2FA Generator
        </span>
        <b aria-hidden="true">↗</b>
      </Link>
    ),
  },
  {
    number: 15,
    phase: "2FA",
    title: "Simpan akses alternatif dengan aman",
    description: (
      <p>
        Jika generator menawarkan tautan alternatif berisi secret key, simpan
        hanya di password manager atau catatan terenkripsi. Tautan tersebut tidak
        boleh dibagikan karena dapat membuka akses ke kode MFA berikutnya.
      </p>
    ),
    panel: (
      <div className="docs-security-note" role="note">
        <strong>Rahasia sensitif</strong>
        <span>Tautan 2FA dapat memuat kunci akun di dalam URL.</span>
      </div>
    ),
  },
  {
    number: 16,
    phase: "2FA",
    title: "Selesai—uji login sekali lagi",
    description: (
      <p>
        Logout lalu login kembali untuk memastikan email Microsoft, kata sandi,
        dan kode MFA berfungsi. Setelah lolos pengujian, simpan recovery code dan
        gunakan akun secara wajar sesuai batas layanan.
      </p>
    ),
    panel: (
      <div className="docs-complete-panel" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>Pengamanan lengkap</strong>
          <small>Microsoft email + ChatGPT + MFA</small>
        </div>
      </div>
    ),
  },
];

const pageStyles = String.raw`
  .docs-page,
  .docs-page * {
    box-sizing: border-box;
  }

  .docs-page {
    --docs-bg: #070a12;
    --docs-surface: #0d1320;
    --docs-surface-strong: #111a2a;
    --docs-border: rgba(255, 255, 255, 0.095);
    --docs-border-strong: rgba(103, 232, 249, 0.24);
    --docs-text: #f6f8ff;
    --docs-muted: #9ba9bf;
    --docs-dim: #6f7e96;
    --docs-cyan: #22d3ee;
    --docs-blue: #60a5fa;
    --docs-indigo: #818cf8;
    --docs-violet: #a78bfa;
    --docs-green: #34d399;
    --docs-amber: #fbbf24;
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    overflow: clip;
    background:
      radial-gradient(circle at 12% 5%, rgba(34, 211, 238, 0.14), transparent 26rem),
      radial-gradient(circle at 86% 18%, rgba(129, 140, 248, 0.16), transparent 30rem),
      var(--docs-bg);
    color: var(--docs-text);
    font-family: var(--font-geist-sans), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.65;
  }

  .docs-page::before {
    position: fixed;
    z-index: -1;
    inset: 0;
    content: "";
    pointer-events: none;
    opacity: 0.28;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, black, transparent 85%);
  }

  .docs-page a {
    color: inherit;
  }

  .docs-skip-link {
    position: fixed;
    z-index: 100;
    top: 12px;
    left: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    background: white;
    color: #07111f !important;
    font-weight: 800;
    transform: translateY(-160%);
    transition: transform 160ms ease;
  }

  .docs-skip-link:focus {
    transform: translateY(0);
  }

  .docs-shell {
    width: min(1120px, calc(100% - 40px));
    margin-inline: auto;
  }

  .site-header {
    position: sticky;
    z-index: 50;
    top: 0;
    border-bottom: 1px solid var(--docs-border);
    background: rgba(7, 10, 18, 0.78);
    backdrop-filter: blur(18px);
  }

  .site-header-inner {
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .site-brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    font-size: 18px;
    font-weight: 780;
    letter-spacing: -0.03em;
  }

  .site-brand-mark {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(103, 232, 249, 0.28);
    border-radius: 13px;
    background: linear-gradient(145deg, rgba(34, 211, 238, 0.22), rgba(129, 140, 248, 0.2));
    color: #a5f3fc;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 12px 30px rgba(34, 211, 238, 0.1);
    font-size: 14px;
    font-weight: 900;
  }

  .site-brand em {
    color: var(--docs-cyan);
    font-style: normal;
  }

  .site-nav {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .site-nav a {
    padding: 9px 12px;
    border-radius: 10px;
    color: var(--docs-muted);
    font-size: 13px;
    font-weight: 680;
    text-decoration: none;
    transition: color 160ms ease, background 160ms ease;
  }

  .site-nav a:hover {
    background: rgba(255, 255, 255, 0.055);
    color: var(--docs-text);
  }

  .site-nav .site-nav-cta {
    border: 1px solid rgba(103, 232, 249, 0.22);
    background: rgba(34, 211, 238, 0.1);
    color: #a5f3fc;
  }

  .docs-hero {
    padding: 82px 0 60px;
  }

  .docs-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(330px, 0.88fr);
    align-items: center;
    gap: 54px;
  }

  .docs-eyebrow,
  .docs-section-kicker,
  .docs-phase {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    border: 1px solid rgba(103, 232, 249, 0.2);
    border-radius: 999px;
    background: rgba(34, 211, 238, 0.07);
    color: #a5f3fc;
    font-size: 12px;
    font-weight: 760;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .docs-eyebrow,
  .docs-section-kicker {
    padding: 7px 11px;
  }

  .docs-eyebrow::before,
  .docs-section-kicker::before {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: var(--docs-green);
    box-shadow: 0 0 14px rgba(52, 211, 153, 0.8);
    content: "";
  }

  .docs-hero h1 {
    max-width: 780px;
    margin: 19px 0 20px;
    font-size: clamp(42px, 7vw, 78px);
    font-weight: 790;
    letter-spacing: -0.062em;
    line-height: 0.98;
  }

  .docs-gradient-text {
    background: linear-gradient(90deg, #f8fafc 5%, #67e8f9 50%, #a5b4fc 95%);
    background-clip: text;
    color: transparent;
  }

  .docs-lead {
    max-width: 680px;
    margin: 0;
    color: var(--docs-muted);
    font-size: clamp(16px, 2vw, 19px);
    line-height: 1.72;
  }

  .docs-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 11px;
    margin-top: 30px;
  }

  .docs-button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px 18px;
    border: 1px solid transparent;
    border-radius: 14px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 760;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  .docs-button:hover {
    transform: translateY(-2px);
  }

  .docs-button-primary {
    background: linear-gradient(135deg, #0891b2, #4f46e5);
    box-shadow: 0 16px 38px rgba(79, 70, 229, 0.22);
    color: white;
  }

  .docs-button-secondary {
    border-color: var(--docs-border);
    background: rgba(255, 255, 255, 0.045);
    color: #e7edfa;
  }

  .docs-button-secondary:hover {
    border-color: var(--docs-border-strong);
  }

  .docs-journey-card {
    position: relative;
    overflow: hidden;
    padding: 27px;
    border: 1px solid rgba(129, 140, 248, 0.2);
    border-radius: 26px;
    background: linear-gradient(145deg, rgba(17, 26, 42, 0.9), rgba(9, 14, 25, 0.94));
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.07);
  }

  .docs-journey-card::after {
    position: absolute;
    inset: auto -70px -100px auto;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(34, 211, 238, 0.1);
    filter: blur(25px);
    content: "";
  }

  .docs-journey-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--docs-border);
  }

  .docs-journey-top strong {
    font-size: 16px;
  }

  .docs-journey-top span {
    border-radius: 999px;
    padding: 5px 9px;
    background: rgba(52, 211, 153, 0.09);
    color: #a7f3d0;
    font-size: 11px;
    font-weight: 750;
  }

  .docs-journey-list {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 14px;
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
  }

  .docs-journey-list li {
    display: grid;
    grid-template-columns: 38px 1fr;
    align-items: center;
    gap: 12px;
  }

  .docs-journey-list b {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid var(--docs-border);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.035);
    color: #a5f3fc;
    font-size: 12px;
  }

  .docs-journey-list span {
    display: block;
    color: var(--docs-muted);
    font-size: 12px;
  }

  .docs-journey-list strong {
    display: block;
    color: var(--docs-text);
    font-size: 14px;
  }

  .docs-section {
    padding: 68px 0;
    scroll-margin-top: 90px;
  }

  .docs-section-header {
    max-width: 740px;
    margin-bottom: 28px;
  }

  .docs-section-header h2 {
    margin: 15px 0 9px;
    font-size: clamp(30px, 4vw, 46px);
    letter-spacing: -0.045em;
    line-height: 1.08;
  }

  .docs-section-header p {
    margin: 0;
    color: var(--docs-muted);
    font-size: 15px;
  }

  .docs-prep-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
  }

  .docs-prep-card {
    min-height: 190px;
    padding: 22px;
    border: 1px solid var(--docs-border);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.033);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  }

  .docs-prep-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    margin-bottom: 25px;
    border: 1px solid rgba(103, 232, 249, 0.18);
    border-radius: 13px;
    background: rgba(34, 211, 238, 0.08);
    color: #a5f3fc;
    font-size: 13px;
    font-weight: 850;
  }

  .docs-prep-card h3 {
    margin: 0 0 7px;
    font-size: 17px;
  }

  .docs-prep-card p {
    margin: 0;
    color: var(--docs-muted);
    font-size: 13.5px;
  }

  .docs-warning {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 18px;
    padding: 25px;
    border: 1px solid rgba(251, 191, 36, 0.25);
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.085), rgba(245, 158, 11, 0.035));
  }

  .docs-warning-mark {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 15px;
    background: rgba(251, 191, 36, 0.12);
    color: #fde68a;
    font-size: 20px;
    font-weight: 900;
  }

  .docs-warning h2 {
    margin: 0 0 7px;
    color: #fef3c7;
    font-size: 21px;
  }

  .docs-warning p {
    margin: 0;
    color: #d6c9a8;
    font-size: 14px;
  }

  .docs-warning ul {
    display: grid;
    gap: 6px;
    margin: 13px 0 0;
    padding-left: 20px;
    color: #cbbf9f;
    font-size: 13.5px;
  }

  .docs-tutorial-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 30px;
  }

  .docs-tutorial-head .docs-section-header {
    margin-bottom: 0;
  }

  .docs-step-count {
    flex: 0 0 auto;
    color: var(--docs-dim);
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-size: 12px;
  }

  .docs-steps {
    display: grid;
    gap: 14px;
  }

  .docs-step {
    display: grid;
    grid-template-columns: 60px minmax(0, 1fr) minmax(260px, 0.72fr);
    gap: 21px;
    align-items: start;
    padding: 22px;
    border: 1px solid var(--docs-border);
    border-radius: 21px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.036), rgba(255, 255, 255, 0.018));
    scroll-margin-top: 92px;
  }

  .docs-step-number {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(103, 232, 249, 0.2);
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(34, 211, 238, 0.15), rgba(79, 70, 229, 0.13));
    color: #cffafe;
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-size: 14px;
    font-weight: 850;
  }

  .docs-step-copy {
    min-width: 0;
  }

  .docs-phase {
    padding: 4px 8px;
    border-color: var(--docs-border);
    background: rgba(255, 255, 255, 0.035);
    color: var(--docs-dim);
    font-size: 9px;
  }

  .docs-step h3 {
    margin: 10px 0 6px;
    font-size: 19px;
    letter-spacing: -0.02em;
    line-height: 1.25;
  }

  .docs-step p {
    margin: 0;
    color: var(--docs-muted);
    font-size: 13.5px;
  }

  .docs-step p a {
    color: #67e8f9;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: rgba(103, 232, 249, 0.35);
    text-underline-offset: 3px;
  }

  .docs-step-panel {
    min-width: 0;
    align-self: center;
  }

  .docs-step-media {
    min-width: 0;
    grid-column: 2 / -1;
    margin-top: 2px;
  }

  .docs-code-panel,
  .docs-action-panel,
  .docs-secret-panel {
    display: grid;
    gap: 6px;
    padding: 15px;
    border: 1px solid var(--docs-border);
    border-radius: 14px;
    background: rgba(4, 8, 16, 0.52);
  }

  .docs-code-panel span,
  .docs-action-panel span,
  .docs-secret-panel span {
    color: var(--docs-dim);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .docs-code-panel code,
  .docs-secret-panel code {
    overflow-wrap: anywhere;
    color: #c4b5fd;
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-size: 13px;
  }

  .docs-secret-panel small {
    color: #fca5a5;
    font-size: 10px;
  }

  .docs-browser-mock {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border: 1px solid var(--docs-border);
    border-radius: 13px;
    background: #080d17;
    color: var(--docs-muted);
    font-size: 10px;
  }

  .docs-browser-mock > span:nth-child(2) {
    overflow: hidden;
    padding: 6px 8px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.04);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .docs-browser-mock b {
    color: #a5f3fc;
    font-size: 9px;
  }

  .docs-browser-dots {
    display: flex;
    gap: 3px;
  }

  .docs-browser-dots i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--docs-dim);
  }

  .docs-credential-mock {
    display: grid;
    gap: 8px;
  }

  .docs-credential-mock div {
    padding: 10px 12px;
    border: 1px solid var(--docs-border);
    border-radius: 12px;
    background: rgba(4, 8, 16, 0.48);
  }

  .docs-credential-mock span,
  .docs-credential-mock strong {
    display: block;
  }

  .docs-credential-mock span {
    margin-bottom: 2px;
    color: var(--docs-dim);
    font-size: 9px;
    text-transform: uppercase;
  }

  .docs-credential-mock strong {
    overflow-wrap: anywhere;
    color: #dbeafe;
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-size: 11px;
  }

  .docs-mini-checklist,
  .docs-status-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .docs-mini-checklist li,
  .docs-status-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #cbd5e1;
    font-size: 11px;
  }

  .docs-mini-checklist li::before {
    width: 18px;
    height: 18px;
    display: grid;
    flex: 0 0 18px;
    place-items: center;
    border-radius: 6px;
    background: rgba(52, 211, 153, 0.11);
    color: #6ee7b7;
    content: "✓";
    font-size: 10px;
  }

  .docs-action-panel strong {
    color: #bfdbfe;
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-size: 12px;
  }

  .docs-flow-line,
  .docs-settings-path {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 64px;
    padding: 10px;
    border: 1px solid var(--docs-border);
    border-radius: 14px;
    background: rgba(4, 8, 16, 0.42);
    color: #cbd5e1;
    font-size: 10px;
    text-align: center;
  }

  .docs-flow-line span,
  .docs-settings-path span {
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.045);
  }

  .docs-flow-line i,
  .docs-settings-path i {
    color: var(--docs-cyan);
    font-style: normal;
  }

  .docs-otp-mock {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    padding: 14px 10px 10px;
    border: 1px solid var(--docs-border);
    border-radius: 14px;
    background: rgba(4, 8, 16, 0.5);
  }

  .docs-otp-mock > span {
    width: 28px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    background: rgba(167, 139, 250, 0.08);
    color: #c4b5fd;
    font-family: var(--font-geist-mono), ui-monospace, monospace;
    font-weight: 800;
  }

  .docs-otp-mock small {
    flex-basis: 100%;
    margin-top: 2px;
    color: var(--docs-dim);
    font-size: 8px;
    text-align: center;
  }

  .docs-password-meter {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 13px;
    border: 1px solid var(--docs-border);
    border-radius: 14px;
    background: rgba(4, 8, 16, 0.45);
    font-size: 10px;
  }

  .docs-password-meter > span:first-child {
    color: var(--docs-muted);
  }

  .docs-password-meter strong {
    color: #6ee7b7;
  }

  .docs-password-bars {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .docs-password-bars i {
    height: 3px;
    border-radius: 99px;
    background: var(--docs-green);
  }

  .docs-status-list li span {
    width: 19px;
    height: 19px;
    display: grid;
    flex: 0 0 19px;
    place-items: center;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.12);
    color: #6ee7b7;
    font-size: 10px;
  }

  .docs-mail-mock,
  .docs-complete-panel {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px;
    border: 1px solid var(--docs-border);
    border-radius: 14px;
    background: rgba(4, 8, 16, 0.48);
  }

  .docs-mail-icon,
  .docs-complete-panel > span {
    width: 34px;
    height: 34px;
    display: grid;
    flex: 0 0 34px;
    place-items: center;
    border-radius: 10px;
    background: rgba(96, 165, 250, 0.12);
    color: #bfdbfe;
    font-weight: 900;
  }

  .docs-mail-mock strong,
  .docs-mail-mock div span,
  .docs-complete-panel strong,
  .docs-complete-panel small {
    display: block;
  }

  .docs-mail-mock strong,
  .docs-complete-panel strong {
    color: #e2e8f0;
    font-size: 11px;
  }

  .docs-mail-mock div span,
  .docs-complete-panel small {
    color: var(--docs-dim);
    font-size: 9px;
  }

  .docs-inline-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 14px 15px;
    border: 1px solid rgba(103, 232, 249, 0.23);
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(79, 70, 229, 0.1));
    color: #cffafe !important;
    text-decoration: none;
  }

  .docs-inline-cta small,
  .docs-inline-cta span {
    display: block;
  }

  .docs-inline-cta small {
    color: var(--docs-muted);
    font-size: 9px;
    font-weight: 550;
  }

  .docs-inline-cta span {
    font-size: 12px;
    font-weight: 800;
  }

  .docs-inline-cta b {
    font-size: 18px;
  }

  .docs-security-note {
    padding: 13px 14px;
    border: 1px solid rgba(248, 113, 113, 0.22);
    border-radius: 14px;
    background: rgba(248, 113, 113, 0.055);
  }

  .docs-security-note strong,
  .docs-security-note span {
    display: block;
  }

  .docs-security-note strong {
    margin-bottom: 3px;
    color: #fecaca;
    font-size: 11px;
  }

  .docs-security-note span {
    color: #cfa8ad;
    font-size: 10px;
  }

  .docs-complete-panel {
    border-color: rgba(52, 211, 153, 0.22);
    background: rgba(52, 211, 153, 0.055);
  }

  .docs-complete-panel > span {
    background: rgba(52, 211, 153, 0.13);
    color: #6ee7b7;
  }

  .docs-link-panel {
    position: relative;
    overflow: hidden;
    padding: 28px;
    border: 1px solid var(--docs-border);
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(17, 26, 42, 0.95), rgba(10, 15, 27, 0.96));
  }

  .docs-link-panel h2 {
    margin: 0 0 7px;
    font-size: 24px;
    letter-spacing: -0.035em;
  }

  .docs-link-panel > p {
    margin: 0;
    color: var(--docs-muted);
    font-size: 13.5px;
  }

  .docs-important-links {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 22px;
  }

  .docs-important-link {
    min-height: 98px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
    padding: 15px;
    border: 1px solid var(--docs-border);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.035);
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  }

  .docs-important-link:hover {
    transform: translateY(-2px);
    border-color: var(--docs-border-strong);
    background: rgba(34, 211, 238, 0.055);
  }

  .docs-important-link span {
    color: var(--docs-dim);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .docs-important-link strong {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #e6edf8;
    font-size: 13px;
  }

  .docs-closing {
    padding: 0 0 72px;
  }

  .docs-closing-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 28px;
    padding: 34px;
    border: 1px solid rgba(103, 232, 249, 0.2);
    border-radius: 26px;
    background:
      radial-gradient(circle at 90% 20%, rgba(129, 140, 248, 0.17), transparent 18rem),
      linear-gradient(135deg, rgba(34, 211, 238, 0.09), rgba(17, 26, 42, 0.9));
  }

  .docs-closing-card span {
    color: #67e8f9;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .docs-closing-card h2 {
    margin: 7px 0 7px;
    font-size: clamp(25px, 3.2vw, 38px);
    letter-spacing: -0.04em;
    line-height: 1.12;
  }

  .docs-closing-card p {
    max-width: 650px;
    margin: 0;
    color: var(--docs-muted);
    font-size: 14px;
  }

  .site-footer {
    padding: 28px 0 36px;
    border-top: 1px solid var(--docs-border);
  }

  .site-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: var(--docs-dim);
    font-size: 11px;
  }

  .site-footer a {
    color: var(--docs-muted);
    text-decoration: none;
  }

  .docs-page a:focus-visible {
    outline: 3px solid rgba(103, 232, 249, 0.72);
    outline-offset: 3px;
  }

  @media (max-width: 920px) {
    .docs-hero-grid {
      grid-template-columns: 1fr;
      gap: 34px;
    }

    .docs-journey-card {
      max-width: 680px;
    }

    .docs-step {
      grid-template-columns: 52px minmax(0, 1fr);
    }

    .docs-step-panel {
      grid-column: 2;
    }

    .docs-step-media {
      grid-column: 2;
    }

    .docs-important-links {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .docs-shell {
      width: min(100% - 24px, 1120px);
    }

    .site-header-inner {
      min-height: 62px;
    }

    .site-nav a:not(.site-nav-cta) {
      display: none;
    }

    .docs-hero {
      padding: 54px 0 38px;
    }

    .docs-hero h1 {
      font-size: clamp(40px, 14vw, 62px);
    }

    .docs-section {
      padding: 46px 0;
    }

    .docs-prep-grid {
      grid-template-columns: 1fr;
    }

    .docs-prep-card {
      min-height: 0;
    }

    .docs-warning {
      grid-template-columns: 1fr;
    }

    .docs-tutorial-head {
      display: block;
    }

    .docs-step-count {
      display: block;
      margin-top: 12px;
    }

    .docs-step {
      grid-template-columns: 44px minmax(0, 1fr);
      gap: 14px;
      padding: 17px;
    }

    .docs-step-number {
      width: 42px;
      height: 42px;
      border-radius: 13px;
    }

    .docs-step-panel {
      grid-column: 1 / -1;
    }

    .docs-step-media {
      grid-column: 1 / -1;
    }

    .docs-closing-card {
      grid-template-columns: 1fr;
      padding: 25px;
    }
  }

  @media (max-width: 480px) {
    .site-brand {
      font-size: 16px;
    }

    .site-brand-mark {
      width: 34px;
      height: 34px;
      border-radius: 11px;
    }

    .site-nav .site-nav-cta {
      padding-inline: 10px;
      font-size: 11px;
    }

    .docs-hero-actions,
    .docs-button {
      width: 100%;
    }

    .docs-journey-card,
    .docs-link-panel {
      padding: 20px;
      border-radius: 20px;
    }

    .docs-important-links {
      grid-template-columns: 1fr;
    }

    .docs-important-link {
      min-height: 82px;
    }

    .docs-flow-line,
    .docs-settings-path {
      flex-wrap: wrap;
    }

    .site-footer-inner {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .docs-page *,
    .docs-page *::before,
    .docs-page *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function RedeemGptPage() {
  return (
    <div className="docs-page" id="top">
      <HashScroll />
      <style>{pageStyles}</style>
      <header className="site-header">
        <div className="docs-shell site-header-inner">
          <Link className="site-brand" href="/" aria-label="FG Store — halaman utama">
            <span className="site-brand-mark" aria-hidden="true">FG</span>
            <span>FG <em>Store</em></span>
          </Link>
          <nav className="site-nav" aria-label="Navigasi panduan">
            <a href="#persiapan">Persiapan</a>
            <a href="#tutorial">16 Langkah</a>
            <a href="#link-penting">Link Penting</a>
            <Link className="site-nav-cta" href="/2fa">Buka 2FA</Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="docs-hero" aria-labelledby="docs-title">
          <div className="docs-shell docs-hero-grid">
            <div>
              <span className="docs-eyebrow">Panduan FG Store</span>
              <h1 id="docs-title">
                Redeem GPT.
                <br />
                <span className="docs-gradient-text">Amankan semuanya.</span>
              </h1>
              <p className="docs-lead">
                Satu alur lengkap dari kode redeem sampai MFA aktif. Kerjakan
                berurutan agar akun Microsoft dan ChatGPT berpindah ke kendalimu
                dengan rapi.
              </p>
              <div className="docs-hero-actions">
                <a className="docs-button docs-button-primary" href="#tutorial">
                  Mulai langkah pertama <span aria-hidden="true">↓</span>
                </a>
                <Link className="docs-button docs-button-secondary" href="/2fa">
                  Buka 2FA Generator <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>

            <aside className="docs-journey-card" aria-label="Ringkasan perjalanan redeem">
              <div className="docs-journey-top">
                <strong>Peta perjalanan</strong>
                <span>± 10 menit</span>
              </div>
              <ol className="docs-journey-list">
                <li><b>01</b><div><strong>Redeem akses</strong><span>Langkah 1–3</span></div></li>
                <li><b>02</b><div><strong>Amankan Microsoft</strong><span>Langkah 4–10</span></div></li>
                <li><b>03</b><div><strong>Masuk ke ChatGPT</strong><span>Langkah 11–13</span></div></li>
                <li><b>04</b><div><strong>Aktifkan 2FA</strong><span>Langkah 14–16</span></div></li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="docs-section" id="persiapan" aria-labelledby="prep-title">
          <div className="docs-shell">
            <div className="docs-section-header">
              <span className="docs-section-kicker">Sebelum mulai</span>
              <h2 id="prep-title">Siapkan tiga hal ini</h2>
              <p>Persiapan singkat akan mencegah proses terputus di tengah verifikasi.</p>
            </div>
            <div className="docs-prep-grid">
              <article className="docs-prep-card">
                <span className="docs-prep-icon" aria-hidden="true">01</span>
                <h3>Kode redeem</h3>
                <p>Gunakan kode asli yang dikirim admin FG Store untuk pesananmu.</p>
              </article>
              <article className="docs-prep-card">
                <span className="docs-prep-icon" aria-hidden="true">02</span>
                <h3>Email pemulihan</h3>
                <p>Siapkan Gmail atau email pribadi aktif untuk menerima kode Microsoft.</p>
              </article>
              <article className="docs-prep-card">
                <span className="docs-prep-icon" aria-hidden="true">03</span>
                <h3>Penyimpanan aman</h3>
                <p>Pakai password manager untuk kata sandi, recovery code, dan akses 2FA.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="docs-section" id="peringatan" aria-labelledby="warning-title">
          <div className="docs-shell">
            <div className="docs-warning" role="note">
              <span className="docs-warning-mark" aria-hidden="true">!</span>
              <div>
                <h2 id="warning-title">Jangan tunda pengamanan akun</h2>
                <p>
                  Akses berasal dari offer regional dan kestabilannya tetap mengikuti
                  sistem penyedia. Setelah redeem berhasil, selesaikan seluruh langkah
                  keamanan dalam satu sesi.
                </p>
                <ul>
                  <li>Jangan membagikan email, kata sandi, OTP, secret key, atau recovery code.</li>
                  <li>Cadangkan percakapan dan data penting secara berkala.</li>
                  <li>Gunakan fitur dan limit akun secara wajar selama masa akses.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section" id="tutorial" aria-labelledby="tutorial-title">
          <div className="docs-shell">
            <div className="docs-tutorial-head">
              <div className="docs-section-header">
                <span className="docs-section-kicker">Tutorial lengkap</span>
                <h2 id="tutorial-title">Ikuti 16 langkah secara berurutan</h2>
                <p>Setiap kartu menunjukkan satu tindakan dan hasil yang perlu kamu pastikan.</p>
              </div>
              <span className="docs-step-count">01 — 16</span>
            </div>

            <div className="docs-steps">
              {steps.map((step) => (
                <article className="docs-step" id={`step-${step.number}`} key={step.number}>
                  <span className="docs-step-number" aria-hidden="true">
                    {String(step.number).padStart(2, "0")}
                  </span>
                  <div className="docs-step-copy">
                    <span className="docs-phase">{step.phase}</span>
                    <h3>{step.title}</h3>
                    {step.description}
                  </div>
                  {step.panel ? <div className="docs-step-panel">{step.panel}</div> : null}
                  {hasTutorialMedia(step.number) ? (
                    <div className="docs-step-media">
                      <TutorialMedia step={step.number} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="docs-section" id="link-penting" aria-labelledby="links-title">
          <div className="docs-shell">
            <div className="docs-link-panel">
              <h2 id="links-title">Link penting, satu tempat</h2>
              <p>Buka hanya alamat yang sesuai dan periksa domain sebelum memasukkan data akun.</p>
              <div className="docs-important-links">
                <a className="docs-important-link" href="https://chongzhi.art/" {...externalLinkProps}>
                  <span>Eksternal</span>
                  <strong>Portal Redeem <b aria-hidden="true">↗</b></strong>
                </a>
                <a className="docs-important-link" href="https://outlook.office.com/mail/inbox" {...externalLinkProps}>
                  <span>Microsoft</span>
                  <strong>Inbox Outlook <b aria-hidden="true">↗</b></strong>
                </a>
                <a className="docs-important-link" href="https://account.live.com/password/Change" {...externalLinkProps}>
                  <span>Microsoft</span>
                  <strong>Ganti Password <b aria-hidden="true">↗</b></strong>
                </a>
                <Link className="docs-important-link" href="/2fa">
                  <span>FG Store</span>
                  <strong>2FA Generator <b aria-hidden="true">→</b></strong>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-closing" aria-labelledby="closing-title">
          <div className="docs-shell">
            <div className="docs-closing-card">
              <div>
                <span>Langkah berikutnya</span>
                <h2 id="closing-title">Secret key sudah siap?</h2>
                <p>
                  Buat kode enam digit langsung di browser. Generator FG Store tidak
                  memerlukan login untuk memproses TOTP.
                </p>
              </div>
              <Link className="docs-button docs-button-primary" href="/2fa">
                Generate kode 2FA <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="docs-shell site-footer-inner">
          <span>© 2026 FG Store · Panduan penggunaan dan pengamanan akun.</span>
          <a href="#top">Kembali ke atas ↑</a>
        </div>
      </footer>
    </div>
  );
}
