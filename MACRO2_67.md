# MACRO2_67: Cloudflare Worker Routing Tests

Модель: GPT-5.5, reasoning extra high.

Цель: Worker and Pages Function routing handle API paths, assets, 404/405 and missing bindings robustly.

Критично: optional cloud layer should fail soft, not break game hosting.

Ownership: `functions/worker.ts`, `functions/api/net/*.ts`, `tests/net-sphere.test.ts`.

Читать: `cloudflare.md`, `wrangler.jsonc`, `functions/worker.ts`, API handlers.

Deliverables:
- unit tests for GET/POST routing, unsupported methods, asset fallback, missing D1;
- response headers/caching documented where relevant;
- no leak of private NET-GEN.

Проверки: `npm run test:unit`, optional `npm run cf:dev` when environment supports it.

Параллельные ограничения: keep cloud optional.
