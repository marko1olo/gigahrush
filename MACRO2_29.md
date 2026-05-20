# MACRO2_29: Reachable Lift Guarantee

Модель: GPT-5.5, reasoning extra high.

Цель: up/down lift buttons and adjacent cells are reachable on story, design and procedural route floors.

Критично: unreachable lift is a hard softlock in a game whose main structure is vertical expeditions.

Ownership: `src/gen/shared.ts`, `src/gen/procedural_floor.ts`, `src/gen/design_floors/full_floor.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Floors`, `src/systems/procedural_floors.ts`, `src/gen/floor_manifest.ts`.

Deliverables:
- lift placement chooses reachable component or carves bounded connector;
- route bounds handled intentionally when only one direction exists;
- debug/test message identifies bad floor id/z/seed.

Проверки: `npm run test:unit`, route deck traversal test.

Параллельные ограничения: do not change FloorLevel enum or normal FloorRun cadence.
