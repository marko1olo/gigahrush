# MACRO2_12: Combat HUD Readability Pass

Модель: GPT-5.5, reasoning extra high.

Цель: игрок за 3 секунды понимает weapon role, ammo, reload/cooldown, durability, hit/miss reason.

Критично: survival ARPG shooter не работает, если бой читается только через таблицы в коде.

Ownership: `src/render/hud.ts`, `src/render/hud_fx.ts`, `src/systems/inventory.ts`, `src/data/weapons.ts`, `tests/ui-layout.test.ts`.

Читать: `desdoc.md P0.1`, `src/data/weapons.ts`, `src/render/hud.ts`, `src/systems/inventory.ts`.

Deliverables:
- compact weapon panel with ammo type/count, cooldown/readiness, durability/tool state;
- hit/miss/damage feedback that does not overlap needs bars;
- mobile-safe scaling and clipping checks.

Проверки: `npm run typecheck`, `npm run test:unit`, `npm run smoke`.

Параллельные ограничения: no DOM UI; canvas HUD only.
