# MACRO2_71: Net Market Rate And Abuse Budget

Модель: GPT-5.5, reasoning extra high.

Цель: cap `/api/net/market` influence per NET-GEN/session/time window, not only per payload.

Критично: global market impulses can be spammed and distort economy if public deployment grows.

Ownership: `functions/api/net/market.ts`, `functions/api/net/common.ts`, `cloudflare/d1/net_sphere_market.sql`, `tests/net-market.test.ts`.

Читать: `README.md Net Market`, `functions/api/net/market.ts`, `tests/net-market.test.ts`.

Deliverables:
- rate/cooldown window per identity;
- bounded aggregate quote snapshots;
- tests for burst rejection and idempotency.

Проверки: `npm run test:unit`.

Параллельные ограничения: local economy remains playable offline.
