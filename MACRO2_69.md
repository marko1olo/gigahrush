# MACRO2_69: D1 Migration Source Of Truth

Модель: GPT-5.5, reasoning extra high.

Цель: clarify which D1 SQL files are canonical and keep setup/schema scripts aligned.

Критично: `cloudflare/d1/net_sphere_names.sql` and market schema risk drifting from setup script and docs.

Ownership: `scripts/cloudflare-net-setup.mjs`, `cloudflare/d1/*.sql`, `cloudflare.md`, `tests/net-sphere.test.ts`.

Читать: `cloudflare.md`, `scripts/cloudflare-net-setup.mjs`, all D1 SQL files.

Deliverables:
- migration order and optional tables documented;
- script applies or explicitly excludes each SQL file;
- tests parse expected table/column names.

Проверки: `npm run test:unit`, `npm run cf:schema` when credentials/environment available.

Параллельные ограничения: do not require Cloudflare for local game build.
