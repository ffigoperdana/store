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
```

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

Untuk menguji endpoint provider gunakan `KLIKQRIS_ENV=sandbox` dan API key Sandbox. Aplikasi mengirim dua header server-side: `x-api-key` dan `id_merchant`; keduanya tidak pernah dikirim ke browser.

Daftarkan callback pada KlikQRIS ke:

```
https://store.fgdev.tech/api/webhooks/klikqris
```

Webhook memeriksa signature yang tercatat saat tagihan dibuat, lalu baru menandai pesanan `PAID` atau `FULFILLED`. Link WhatsApp dan delivery digital tidak dibuka hanya berdasarkan bukti transfer.

## 4. Setelah deploy

1. Buka `/admin/login` dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
2. Buat produk, lalu buat varian dengan salah satu mode fulfilment.
3. Publish produknya.
4. Buat transaksi kecil memakai QRIS Sandbox/production.
5. Pastikan callback mengubah status sebelum mengecek link WhatsApp atau delivery.

## Mode fulfilment

- `MANUAL_WHATSAPP`: setelah status `PAID`, tombol WhatsApp admin aktif untuk pengiriman manual.
- `SINGLE_SHARED`: satu URL atau kode bersama dikirim otomatis ke seluruh pembeli yang sudah `PAID`.
- `UNIQUE_POOL`: setiap baris URL/kode dipakai sekali. Stok dikunci ketika checkout dibuat dan ditandai terkirim sesudah callback sukses.
