# MACRO2_32: Roof And Dark Metro Pocket Audit

Модель: GPT-5.5, reasoning extra high.

Цель: classify and repair disconnected pockets on Roof and Dark Metro route floors.

Критично: these floors have special geometry/dynamic sky/trains, so ordinary full-floor expansion can leave misleading unreachable spaces.

Ownership: `src/gen/design_floors/roof.ts`, `src/gen/design_floors/dark_metro.ts`, `src/gen/design_floors/full_floor.ts`, `tests/roof-floor.test.ts`, `tests/rail-trains.test.ts`.

Читать: `Docs/DesignFloors/roof.md`, `Docs/DesignFloors/dark_metro.md`, `src/systems/rail_trains.ts`.

Deliverables:
- unreachable areas are connected, blocked intentionally, or excluded from quest/loot placement;
- train platforms remain reachable and boardable;
- roof shelters/descent routes remain readable.

Проверки: `npm run test:unit`, `npm run smoke`.

Параллельные ограничения: dynamic sky/render hooks stay generic.
