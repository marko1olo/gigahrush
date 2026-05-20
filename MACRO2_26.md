# MACRO2_26: Universal Generation Reachability Gate

Модель: GPT-5.5, reasoning extra high.

Цель: автоматизировать BFS-аудит spawn -> rooms -> lifts -> containers -> entities -> route cues для всех story/design/procedural floors.

Критично: `content:audit` зеленый, но не доказывает, что игрок реально дойдет до POI, лифта, контейнера или награды.

Ownership: `tests/procedural-floors.test.ts`, новый `tests/generation-reachability.test.ts`, read-only helpers under `src/gen/**`.

Читать: `README.md`, `architecture.md`, `src/gen/floor_manifest.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/procedural_floor.ts`.

Deliverables:
- shared test helper classifies reachable cells, rooms, lifts, containers, entities;
- covers all 6 story floors, 17 design floors, selected seed matrix for procedural specs;
- reports intentional gated/unreachable spaces separately from bugs.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: first pass should test/report; only fix local obvious blockers if ownership is safe.
