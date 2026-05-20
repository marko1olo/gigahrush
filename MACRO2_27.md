# MACRO2_27: Procedural Floor Final Connectivity Pass

Модель: GPT-5.5, reasoning extra high.

Цель: гарантировать связность procedural floors после всех поздних операций: doors, water, rails, anomalies, loot and lift placement.

Критично: MST connectivity at room-graph time is insufficient if later anomaly/sanitizer work cuts route components.

Ownership: `src/gen/procedural_floor.ts`, `src/gen/shared.ts`, `tests/procedural-floors.test.ts`.

Читать: `Docs/ProceduralFloors/geometry.md`, `Docs/ProceduralFloors/anomaly.md`, `src/gen/procedural_floor.ts`.

Deliverables:
- final repair/check stage after anomaly application;
- preserve both lifts and main rooms in reachable component;
- seed regression matrix including smog, mushroom, collectors, deep route floors.

Проверки: `npm run test:unit`, focused forced seeds, `npm run content:audit`.

Параллельные ограничения: no story content inside procedural floors.
