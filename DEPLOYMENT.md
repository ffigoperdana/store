# Deploy FG Store di Coolify

## 1. Build dan database

Pilih **Dockerfile** sebagai build pack. Aplikasi akan menjalankan migration PostgreSQL saat start.
Siapkan PostgreSQL di Coolify lalu isi `DATABASE_URL` dengan connection URL internal dari database tersebut.

## 2. Environment wajib

```dotenv
DATABASE_URL=postgresql://...
SESSION_SECRET=<random-string-minimum-32-characters>
INVENTORY_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
ADMIN_EMAIL=owner@domainkamu.com
ADMIN_PASSWORD=<password-admin-kuat>
ADMIN_NAME=FG Store Owner
STORE_WHATSAPP=628xxxxxxxxxx
COOKIE_SECURE=true
PAYMENT_PROVIDER=klikqris
ALLOW_MOCK_PAY=false
AUTO_SEED_CATALOG=true
SEED_DEMO_DATA=false
APP_BASE_URL=https://store.fgdev.tech
PUBLIC_BASE_URL=https://store.fgdev.tech
EMAIL_PROVIDER=resend
RESEND_API_KEY=<runtime-secret-dari-resend>
EMAIL_FROM=FG Store <orders@mail.fgdev.tech>
EMAIL_REPLY_TO=support@fgdev.tech
CHECKOUT_RATE_LIMIT_WINDOW_SECONDS=600
CHECKOUT_RATE_LIMIT_IP_MAX=12
CHECKOUT_RATE_LIMIT_PHONE_MAX=5
```

`AUTO_SEED_CATALOG=true` memastikan katalog awal ChatGPT Plus, Notion Mandarin Starter, E-book Web Design Dasar, dan Prompt Pack Produktif tersedia secara idempotent. Seed ini tidak menimpa perubahan produk yang sudah dikelola admin. `SEED_DEMO_DATA` wajib tetap `false` (atau tidak diisi) di Coolify; URL/stok contoh serta data pembeli dan transaksi palsu hanya ditujukan untuk Docker lokal.

Generate nilai aman, jangan menggunakan contoh `.env.example` di production:

```bash
openssl rand -base64 32
```

Gunakan satu hasil untuk `INVENTORY_ENCRYPTION_KEY`, lalu hasil lain untuk `SESSION_SECRET`.

## 3. KlikQRIS

Tambahkan dari dashboard KlikQRIS, hanya di environment Coolify:

```dotenv
KLIKQRIS_ENV=production
KLIKQRIS_MODE=PG
KLIKQRIS_API_KEY=<x-api-key-dari-klikqris>
KLIKQRIS_MERCHANT_ID=<id_merchant-dari-klikqris>
```

`PUBLIC_BASE_URL` adalah URL publik **FG Store**, bukan Base URL API KlikQRIS. Base API provider (`https://klikqris.com/api`) sudah ditentukan di kode server dan tidak perlu dimasukkan ke environment.

Untuk menguji endpoint provider gunakan `KLIKQRIS_ENV=sandbox` dan API key Sandbox. Aplikasi mengirim `x-api-key` dan `id_merchant` lewat header server-side, serta `id_merchant` pada request body sesuai dokumentasi. Kredensial tidak pernah dikirim ke browser.

Daftarkan callback pada KlikQRIS ke:

```
https://store.fgdev.tech/api/webhooks/klikqris
```

Webhook memeriksa signature yang tercatat saat tagihan dibuat, lalu baru menandai pesanan `PAID` atau `FULFILLED`. Link WhatsApp dan delivery digital tidak dibuka hanya berdasarkan bukti transfer.

Halaman status pesanan juga melakukan rekonsiliasi terbatas melalui endpoint status KlikQRIS setiap 30 detik ketika transaksi masih `PENDING`. Webhook tetap menjadi jalur utama; pengecekan status ini menjadi fallback bila pengiriman webhook terlambat.

Checkout dilindungi oleh UUID idempotensi unik di PostgreSQL. Klik ganda atau retry dengan kunci yang sama mengembalikan order yang sudah ada dan tidak membuat tagihan provider kedua. Rate limit checkout juga disimpan dengan UPSERT atomik di PostgreSQL, sehingga tetap konsisten ketika beberapa instance aplikasi berjalan sekaligus.

## 4. Setelah deploy

1. Buka `/admin/login` dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
2. Buat produk, lalu buat varian dengan salah satu mode fulfilment.
3. Publish produknya.
4. Buat transaksi kecil memakai QRIS Sandbox/production.
5. Pastikan callback mengubah status sebelum mengecek link WhatsApp atau delivery.

## 5. Email transaksi

Cloudflare Email Routing dipakai untuk menerima balasan seperti `support@fgdev.tech`, bukan sebagai pengirim email transaksi. Untuk pengiriman order, konfigurasi paling sederhana adalah Resend API melalui HTTPS. Ikuti panduan lengkap di [`EMAIL-SETUP.md`](./EMAIL-SETUP.md).

## Mode fulfilment

- `MANUAL_WHATSAPP`: setelah status `PAID`, tombol WhatsApp admin aktif untuk pengiriman manual.
- `SINGLE_SHARED`: satu URL atau kode bersama dikirim otomatis ke seluruh pembeli yang sudah `PAID`.
- `UNIQUE_POOL`: setiap baris URL/kode dipakai sekali. Stok dikunci ketika checkout dibuat dan ditandai terkirim sesudah callback sukses.
