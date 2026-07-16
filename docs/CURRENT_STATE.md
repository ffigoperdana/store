# Current State

## Selesai

- Landing page under development.
- Dokumentasi redeem 16 langkah dengan sembilan screenshot lokal pada langkah
  2, 3, 6, 8, 13, dan 14. Semua data akun, kode redeem, serta QR MFA pada aset
  referensi sudah dianonimkan permanen sebelum masuk `public/tutorial`.
- Generator TOTP client-side, deep link fragment, countdown, current/next code,
  clipboard fallback, dan validasi Base32.
- PWA manifest, service worker, offline page, favicon, serta ikon 192/512.
- Metadata Open Graph, security headers, health endpoint, dan Docker standalone.
- Unit test RFC dan route smoke test.
- Galeri screenshot responsif, lazy-loaded, bisa diperbesar, dan memiliki alt
  text serta caption. Total aset tutorial sekitar 758 KB.
- Lighthouse mobile terbaru: dokumentasi 98/100/100/100 dan 2FA
  99/100/100/100 (Performance/Accessibility/Best Practices/SEO), keduanya CLS 0.

## Berikutnya

- Implementasi homepage store dan section `#alur` pada fase terpisah.
- Tambahkan katalog/checkout hanya setelah kebutuhan produk dan payment flow jelas.
- Pantau dependency dan ulangi audit Lighthouse setelah konten utama bertambah.

## Known constraints

- Kode TOTP bergantung pada Web Crypto dan secure context pada browser modern.
- Link `#key=` tetap merupakan rahasia; pengguna harus menyimpannya di password
  manager dan tidak membagikannya.
