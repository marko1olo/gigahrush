# MACRO2_66: Net Sphere UI Offline Smoke

Модель: GPT-5.5, reasoning extra high.

Цель: Net Sphere terminal is usable and readable when Cloudflare API is offline/missing.

Критично: Net Sphere is optional; offline state must never block single-player progression.

Ownership: `src/systems/net_sphere.ts`, `src/render/net_sphere_ui.ts`, `scripts/smoke-playability.mjs`, `tests/net-sphere.test.ts`.

Читать: `README.md Cloudflare Net Sphere`, `cloudflare.md`, `src/systems/net_sphere.ts`.

Deliverables:
- smoke opens `N`, checks offline/503 text, close/reopen, no input lock;
- UI clips safely on desktop/mobile;
- no progression depends on remote API.

Проверки: `npm run test:unit`, `SMOKE_SCENARIO=net npm run smoke`.

Параллельные ограничения: no network dependency in smoke success path.
