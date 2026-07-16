import Image from "next/image";
import styles from "./tutorial-media.module.css";

type TutorialImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

const tutorialImages: Partial<Record<number, TutorialImage[]>> = {
  2: [
    {
      src: "/tutorial/step-02-redeem-form.png",
      width: 893,
      height: 833,
      alt: "Tampilan Redeem Center dengan pilihan EUR Plus, kolom kode contoh, jumlah satu, dan tombol Redeem yang ditandai panah merah.",
      caption:
        "Pilih inventory EUR Plus, masukkan kode redeem, atur jumlah menjadi 1, lalu tekan Redeem.",
    },
  ],
  3: [
    {
      src: "/tutorial/step-03-redeem-result.png",
      width: 831,
      height: 768,
      alt: "Halaman Batch redeem done dengan kolom email Outlook dan password email yang telah disamarkan.",
      caption:
        "Setelah redeem berhasil, salin alamat Outlook dan password email dari tabel hasil. Data pada gambar sudah disamarkan.",
    },
  ],
  6: [
    {
      src: "/tutorial/step-06-recovery-email.png",
      width: 688,
      height: 710,
      alt: "Dialog Microsoft Let's protect your account dengan kolom alternate email dan tombol Next.",
      caption:
        "Isi email pemulihan pribadimu, lalu pilih Next. Jangan memilih Skip for now.",
    },
  ],
  8: [
    {
      src: "/tutorial/step-08-01-open-settings.png",
      width: 951,
      height: 326,
      alt: "Header inbox Outlook berbahasa Tiongkok dengan ikon roda gigi Settings di kanan atas ditandai panah merah.",
      caption: "Dari inbox Outlook, buka ikon Settings di kanan atas.",
    },
    {
      src: "/tutorial/step-08-02-language-menu.png",
      width: 955,
      height: 1016,
      alt: "Panel Language and time Outlook dengan menu General dan pilihan bahasa Chinese yang ditandai.",
      caption: "Di Settings, pilih General lalu buka pilihan bahasa.",
    },
    {
      src: "/tutorial/step-08-03-select-indonesian.png",
      width: 925,
      height: 966,
      alt: "Daftar bahasa Outlook dengan opsi Indonesia (Indonesia) disorot warna biru.",
      caption: "Pilih Indonesia (Indonesia) dari daftar bahasa.",
    },
    {
      src: "/tutorial/step-08-04-save-language.png",
      width: 920,
      height: 897,
      alt: "Panel Language and time Outlook dengan Indonesia (Indonesia) terpilih dan tombol Save berwarna biru.",
      caption: "Pastikan Indonesia terpilih, lalu tekan Save.",
    },
  ],
  13: [
    {
      src: "/tutorial/step-13-open-manual-key.png",
      width: 675,
      height: 879,
      alt: "Dialog Hubungkan aplikasi autentikator di ChatGPT dengan tautan Kesulitan memindai yang ditandai; kode QR disamarkan.",
      caption:
        "Pilih Kesulitan memindai? untuk menampilkan secret key manual. QR pada gambar sengaja disamarkan.",
    },
  ],
  14: [
    {
      src: "/tutorial/step-14-fg-2fa.png",
      width: 558,
      height: 528,
      alt: "Generator 2FA FG Store berisi secret key contoh, kode enam digit, tombol salin, dan indikator waktu.",
      caption:
        "Tempel secret key manual ke generator FG Store, lalu salin kode enam digit yang sedang aktif.",
    },
  ],
};

export const tutorialImageSteps = Object.freeze(
  Object.keys(tutorialImages).map(Number),
);

export function hasTutorialMedia(step: number): boolean {
  return Boolean(tutorialImages[step]?.length);
}

export function TutorialMedia({ step }: { step: number }) {
  const images = tutorialImages[step];

  if (!images?.length) return null;

  return (
    <div
      className={`${styles.gallery} ${images.length === 1 ? styles.single : ""}`}
      aria-label={`Screenshot tutorial langkah ${step}`}
    >
      {images.map((image, index) => (
        <figure className={styles.figure} key={image.src}>
          <a
            className={styles.imageLink}
            href={image.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka Gambar ${step}.${index + 1} dalam ukuran penuh`}
          >
            <span className={styles.frame}>
              <Image
                className={styles.image}
                src={image.src}
                width={image.width}
                height={image.height}
                alt={image.alt}
                sizes="(max-width: 720px) calc(100vw - 58px), (max-width: 920px) calc(100vw - 140px), 480px"
                loading="lazy"
                decoding="async"
              />
              <span className={styles.badge} aria-hidden="true">
                Gambar {step}.{index + 1}
              </span>
              <span className={styles.zoomHint} aria-hidden="true">
                Perbesar ↗
              </span>
            </span>
          </a>
          <figcaption>{image.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
