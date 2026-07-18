# Setup email transaksi FG Store

FG Store memakai dua jalur email yang berbeda:

- **Email masuk:** Cloudflare Email Routing meneruskan `support@fgdev.tech` ke Gmail/Outlook admin.
- **Email keluar:** Resend mengirim konfirmasi pembayaran dan akses digital dari backend FG Store.

Cloudflare Email Routing tidak membuat mailbox dan bukan SMTP outbound untuk mengirim email customer. Dokumentasi resmi: [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/get-started/route-emails/) dan [Resend + Cloudflare](https://resend.com/docs/knowledge-base/cloudflare).

## A. Membuat alamat support yang masuk ke inbox pribadi

1. Buka Cloudflare Dashboard untuk zona `fgdev.tech`.
2. Pilih **Email > Email Routing** lalu aktifkan Email Routing.
3. Tambahkan destination address berupa Gmail/Outlook admin dan selesaikan verifikasinya.
4. Buat custom address `support@fgdev.tech` dan arahkan ke destination tersebut.
5. Uji dengan mengirim email dari alamat lain ke `support@fgdev.tech`.

Jika apex `fgdev.tech` sudah memakai Google Workspace, Microsoft 365, Zoho, atau server email lain, jangan menimpa MX yang aktif. Gunakan provider mailbox tersebut atau subdomain inbound terpisah.

## B. Menyiapkan domain pengirim Resend

1. Buat akun Resend lalu buka **Domains > Add Domain**.
2. Tambahkan subdomain `mail.fgdev.tech`. Subdomain memisahkan reputasi email transaksi dari domain utama.
3. Pilih setup Cloudflare otomatis atau salin record DNS yang diberikan Resend.
4. Tambahkan record MX return-path, TXT SPF, dan TXT DKIM dengan nilai persis dari dashboard Resend.
5. Pastikan seluruh record email berstatus **DNS only**, bukan proxied.
6. Tunggu hingga status domain di Resend menjadi **Verified**.
7. Buat API key khusus FG Store. Salin sekali dan jangan commit ke Git.

Jangan membuat dua record `v=spf1` pada hostname yang sama. Resend menjelaskan verifikasi domain di [dokumentasi domain](https://resend.com/docs/dashboard/domains/introduction).

## C. DMARC

Tambahkan TXT untuk `_dmarc.mail.fgdev.tech` dan mulai dari mode monitoring:

```text
v=DMARC1; p=none; rua=mailto:dmarc@fgdev.tech;
```

Setelah pengujian Gmail/Outlook menunjukkan SPF, DKIM, dan DMARC lulus, kebijakan dapat dinaikkan bertahap ke `quarantine` lalu `reject`. Jangan langsung memakai `reject` sebelum seluruh sumber email dipastikan benar. Referensi: [DMARC Resend](https://resend.com/docs/dashboard/domains/dmarc).

## D. Environment Coolify

Tambahkan sebagai **Runtime Variables**, bukan Build Variables:

```dotenv
APP_BASE_URL=https://store.fgdev.tech
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=FG Store <orders@mail.fgdev.tech>
EMAIL_REPLY_TO=support@fgdev.tech
```

Pengaturan Coolify:

1. Buka application FG Store > **Environment Variables**.
2. Tambahkan lima variabel di atas.
3. Tandai `RESEND_API_KEY` sebagai secret/locked.
4. Jangan memakai awalan `NEXT_PUBLIC_`; API key hanya boleh tersedia di server.
5. Jangan aktifkan sebagai build variable.
6. Save lalu **Redeploy** application.

Dokumentasi resmi: [Coolify environment variables](https://coolify.io/docs/knowledge-base/environment-variables) dan [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

## E. Cara kerja di FG Store

1. Pembeli mengisi email saat checkout. Email wajib untuk produk otomatis dan opsional untuk pengiriman manual WhatsApp.
2. KlikQRIS mengirim callback pembayaran sukses.
3. Database menandai payment `PAID`, mengalokasikan shared URL atau satu item unique pool, lalu membuat status email `PENDING`.
4. Respons webhook dikirim lebih dahulu; pekerjaan email dijalankan setelah respons.
5. Resend menerima idempotency key per order sehingga retry tidak membuat email duplikat.
6. URL/kode langsung tampil di halaman pesanan dan juga masuk ke email pembeli.
7. Untuk produk manual, email mengarahkan pembeli ke halaman pesanan dan tombol WhatsApp admin.
8. Admin dapat melihat status email dan menekan **Coba kirim/Kirim ulang** di laporan order.

## F. Pengujian sebelum produksi

1. Gunakan checkout mock lokal dan isi email sungguhan hanya jika memang ingin menguji pengiriman eksternal.
2. Di local `.env`, ubah `EMAIL_PROVIDER=resend` dan isi API key/domain verified, lalu rebuild Docker.
3. Simulasikan callback pembayaran.
4. Pastikan akses tampil di website, email diterima, dan admin menunjukkan status `Terkirim`.
5. Uji Gmail dan Outlook, lalu buka raw headers dan pastikan `spf=pass`, `dkim=pass`, serta `dmarc=pass`.
6. Uji Reply-To dan pastikan balasan masuk melalui `support@fgdev.tech`.
7. Kembalikan local ke `EMAIL_PROVIDER=disabled` jika tidak ingin mengirim email saat development.

Jangan menjalankan SMTP server sendiri untuk tahap awal. PTR/rDNS, reputasi IP, bounce, rate limit, abuse handling, dan deliverability akan menjadi tanggung jawab sendiri.
