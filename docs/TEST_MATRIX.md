# Test Matrix

## Otomatis

| Area | Pemeriksaan | Perintah |
| --- | --- | --- |
| TOTP | RFC 4226/6238, Base32, timing, opsi invalid | `npm test` |
| Type | TypeScript strict/no emit | `npx tsc --noEmit` |
| Code quality | ESLint | `npm run lint` |
| Production | Next standalone build | `npm run build` |
| Routes | `/`, docs, 2FA, offline, health, screenshot/caption | `npm run test:routes` |
| Aset tutorial | Keberadaan file, ukuran per file, total budget 1,2 MB | `npm run test:routes` |
| Container | build, health, HTTP route smoke test | `docker compose up --build` |

## Browser

- Mobile 360×800 dan desktop 1440×900 tidak overflow horizontal.
- Navigasi keyboard dapat mencapai input, copy code, copy link, dan semua CTA.
- Secret valid menghasilkan current/next code; kode berganti di batas 30 detik.
- Copy memberikan feedback dan link memakai `#key=`.
- Reload deep link mengisi secret tanpa persistence tambahan.
- Reduced motion menonaktifkan orbit/pulse.
- Manifest, icon, service worker, dan offline fallback terdeteksi.
- Lighthouse mobile dijalankan pada build/container produksi.
- Galeri langkah 8 dan screenshot langkah 14 diperiksa pada desktop dan mobile.
- Halaman docs dan 2FA tidak memiliki warning/error console pada smoke test.
