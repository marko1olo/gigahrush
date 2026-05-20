# MACRO2_2: Stable Debug Command API For Smoke

Модель: GPT-5.5, reasoning extra high.

Цель: убрать зависимость smoke от числовых индексов debug-команд и дать стабильные ids для сценариев.

Критично: `scripts/smoke-playability.mjs` сейчас знает индексы команд; любое добавление пункта debug menu ломает smoke неявно.

Ownership: `src/systems/debug.ts`, `scripts/smoke-playability.mjs`, `tests/debug-commands.test.ts`.

Читать: `README.md`, `architecture.md`, `src/systems/debug.ts`, `scripts/smoke-playability.mjs`.

Deliverables:
- `DebugCommandId`/lookup по id без изменения player-facing меню;
- smoke использует ids: teleport, force faction event, rare samosbor, expedition setup, stress spawn;
- unit-тест на уникальность ids и наличие обязательных smoke hooks.

Проверки: `npm run typecheck`, `npm run test:unit`, `npm run smoke`, `SMOKE_SCENARIO=third-wave npm run smoke`.

Параллельные ограничения: не добавлять новые debug cheats кроме стабилизации доступа к существующим.
