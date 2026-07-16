# FG Store

Website dokumentasi redeem GPT Plus dan generator kode TOTP/2FA yang berjalan
sepenuhnya di browser. Halaman utama sengaja menampilkan status _under
development_ sampai modul store berikutnya siap.

## Route

- `/` — status pengembangan dan pintasan fitur yang sudah tersedia.
- `/redeem-gpt#tutorial` — panduan redeem dan pengamanan akun dalam 16 langkah.
- `/2fa` — generator TOTP 6 digit, periode 30 detik, HMAC-SHA1.
- `/api/health` — health check untuk Docker/Coolify.

## Menjalankan lokal

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000`.

## Test dan build

```bash
npm test
npm run lint
npm run build
npm run test:routes
```

## Docker lokal

```bash
docker compose up --build
```

Container tersedia di `http://localhost:3000`. Untuk port host lain:

```bash
PORT=8080 docker compose up --build
```

## Deploy ke Coolify

1. Hubungkan repository GitHub ini sebagai resource baru.
2. Pilih build pack **Dockerfile** dan gunakan `Dockerfile` di root repository.
3. Set exposed/container port ke `3000`.
4. Set health check path ke `/api/health`.
5. Tambahkan domain `store.fgdev.tech` dan aktifkan HTTPS.
6. Deploy. Aplikasi tidak membutuhkan database atau environment secret.

HTTPS diperlukan agar service worker PWA dan Clipboard API bekerja penuh. Jika
Coolify mengatur `PORT`, server standalone Next.js akan menggunakannya; default
image adalah `3000`.

## Model keamanan 2FA

- Secret hanya diproses menggunakan Web Crypto pada perangkat pengguna.
- Secret tidak dikirim, dicatat, atau disimpan ke localStorage/IndexedDB.
- Link alternatif memakai fragment `#key=...`, sehingga nilainya tidak terkirim
  dalam HTTP request. Format lama `?key=` tetap dibaca lalu dipindahkan ke fragment.
- Cache PWA melewati navigasi dengan query sensitif.

Dokumentasi pengembangan ringkas tersedia di [`docs/START_HERE.md`](docs/START_HERE.md).
