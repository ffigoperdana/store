# Tutorial Image Integration Validation

Date: 2026-07-16  
Target: Docker standalone / Coolify  
Container: `fg-store-localtest` on `127.0.0.1:8085`

## Implemented

- Added local tutorial screenshots to steps 2, 3, 6, 8, 13, and 14.
- Step 8 contains four ordered Outlook language screenshots.
- Step 14 uses a fresh screenshot from the FG Store 2FA generator.
- Kept steps 7 and 14 free from reference-site branded URLs.
- Permanently replaced the visible redeem code, account credentials, recovery
  address, browser identity, inbox OTP content, and MFA QR with safe placeholders
  or opaque redactions before publishing.
- Added responsive server-rendered figures, full-size links, captions, explicit
  dimensions, and lazy loading without new client JavaScript.
- Tutorial source assets total 757,276 bytes.

## Validation

- TOTP unit tests: 9 passed, 0 failed.
- ESLint: passed.
- Next.js production build and strict TypeScript: passed.
- Standalone route and asset tests: 7 passed, 0 failed.
- Docker build: passed.
- Final Docker image size: 70.8 MB.
- Container health check: healthy.
- HTTP 200: `/`, `/redeem-gpt`, `/2fa`, both sampled tutorial PNGs, and
  `/api/health`.
- Browser mobile width: no horizontal overflow; all 9 figures rendered.
- Browser console: no warnings or errors on docs and 2FA.

## Lighthouse 13.4.0 mobile

Scores are Performance / Accessibility / Best Practices / SEO.

| Route | Scores | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: |
| `/redeem-gpt` | 98 / 100 / 100 / 100 | 1.1 s | 2.4 s | 22 ms | 0 |
| `/2fa` | 99 / 100 / 100 / 100 | 0.8 s | 2.2 s | 20 ms | 0 |
