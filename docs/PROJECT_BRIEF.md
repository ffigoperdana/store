# Project Brief

## Tujuan

Menyediakan dokumentasi redeem yang mudah diikuti dan generator 2FA privat pada
`store.fgdev.tech`, dengan pengalaman mobile yang cepat dan dapat dipasang
sebagai PWA.

## MVP

1. `/` menyatakan store masih dikembangkan dan mengarahkan ke dua fitur aktif.
2. `/redeem-gpt#tutorial` memuat persiapan, peringatan, 16 langkah, dan link penting.
3. `/2fa` menerima Base32, menghasilkan TOTP 6 digit/30 detik, menampilkan kode
   berikutnya, countdown, copy, serta link alternatif aman.
4. Seluruh route responsif, dapat dinavigasi dengan keyboard, dan menghormati
   `prefers-reduced-motion`.
5. Aplikasi memiliki manifest, service worker, offline fallback, health check,
   security headers, dan image Docker non-root.

## Non-goals saat ini

- Checkout, pembayaran, katalog, akun pengguna, atau database store.
- Menyimpan secret 2FA atau mengirimkannya ke API.
- Menyalin aset gambar atau wording dari situs referensi secara verbatim.

## Ukuran keberhasilan

- Vector RFC 4226/6238 lulus.
- Production build dan standalone route test lulus.
- Container lokal sehat dan seluruh route utama mengembalikan HTTP 200.
- Lighthouse mobile tidak menemukan masalah performa, aksesibilitas, best
  practices, SEO, atau installability yang bersifat blocking.
