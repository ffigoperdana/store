# Start Here

FG Store saat ini memiliki dua modul publik: dokumentasi redeem GPT Plus dan
generator TOTP. Baca dokumen berikut sesuai kebutuhan:

- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) — tujuan, scope, dan acceptance criteria.
- [`CURRENT_STATE.md`](CURRENT_STATE.md) — status implementasi dan pekerjaan berikutnya.
- [`ADR-001-client-side-totp.md`](ADR-001-client-side-totp.md) — keputusan keamanan TOTP.
- [`TEST_MATRIX.md`](TEST_MATRIX.md) — cakupan verifikasi sebelum deploy.
- [`../reports/task/2026-07-16-initial-build.md`](../reports/task/2026-07-16-initial-build.md) — hasil build, Docker, browser, dan Lighthouse pertama.

Kode aplikasi berada di `app/`, komponen reusable di `components/`, dan logika
TOTP murni di `lib/totp.ts`. Deployment produksi menggunakan Dockerfile
standalone di Coolify.
