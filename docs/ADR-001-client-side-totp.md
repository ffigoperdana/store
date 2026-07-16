# ADR-001: TOTP dihitung sepenuhnya di client

Status: Accepted

## Konteks

Generator membutuhkan secret MFA yang setara dengan kredensial. Mengirim secret
ke server akan memperbesar risiko log, analytics, database, atau access log
menyimpan data sensitif.

## Keputusan

- Decode Base32 dan HMAC-SHA1 dijalankan melalui Web Crypto di browser.
- Tidak ada endpoint TOTP, persistence, logging, atau analytics.
- Link share memakai URL fragment `#key=` karena fragment tidak ikut dalam HTTP
  request. Query `?key=` hanya didukung untuk kompatibilitas lalu diganti di
  history menjadi fragment.
- Service worker tidak menyimpan navigasi/query yang mengandung nama parameter
  sensitif.

## Konsekuensi

Privasi lebih baik dan alat dapat bekerja offline setelah dimuat. Sebaliknya,
dukungan bergantung pada browser modern dan pengguna tetap bertanggung jawab
menjaga link atau secret yang terlihat di layar.
