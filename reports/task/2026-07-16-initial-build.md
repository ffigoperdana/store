# Initial Build Validation

Date: 2026-07-16  
Target: Docker standalone / Coolify  
Runtime: Node.js 24 Alpine, Next.js 16

## Automated checks

- TOTP unit tests: 9 passed, 0 failed.
- TypeScript strict check: passed.
- ESLint: passed.
- Production build: passed.
- Standalone route tests: 5 passed, 0 failed.
- Docker image build: passed.
- Final Docker image size: 70.1 MB.
- Final container: `running`, `healthy`, user `nextjs`.
- HTTP smoke tests: `/`, `/redeem-gpt`, `/2fa`, manifest, sitemap, and health all returned 200.

## Lighthouse 13.4.0 mobile

Scores are ordered as Performance / Accessibility / Best Practices / SEO.

| Route | Scores | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: |
| `/` | 99 / 100 / 100 / 100 | 0.8 s | 2.2 s | 10 ms | 0 |
| `/redeem-gpt` | 98 / 100 / 100 / 100 | 1.0 s | 2.4 s | 20 ms | 0 |
| `/2fa` | 99 / 100 / 100 / 100 | 0.8 s | 2.2 s | 20 ms | 0 |

## Browser checks

- `/redeem-gpt#tutorial` resolves to the tutorial heading with sticky-header offset.
- Documentation contains exactly 16 step cards.
- Mobile 2FA view has no horizontal overflow at the tested breakpoint.
- A known Base32 secret generates current and next codes.
- Invalid Base32 displays the expected validation error.
- Copy-code feedback appears and clipboard content matches the rendered code.
- Browser console reported no warning or error during the inspected routes.
