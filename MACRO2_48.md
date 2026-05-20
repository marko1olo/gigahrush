# MACRO2_48: Route-Floor Quest Target Model

Модель: GPT-5.5, reasoning extra high.

Цель: contracts, quests and rumors can target `designFloorId`, exact `z`, or procedural anomaly/tag, not only base `FloorLevel`.

Критично: `FloorLevel` mood is not enough for 17 design floors and 62 procedural gaps; players need exact route intent.

Ownership: `src/data/contracts.ts`, `src/systems/contracts.ts`, `src/systems/quests.ts`, `src/data/rumors.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Floors`, `src/systems/procedural_floors.ts`, `desdoc.md P1.2`.

Deliverables:
- backward-compatible target shape;
- UI/map/quest text displays z/route/anomaly when present;
- test create/list/complete route-floor contract.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no new quest system; extend existing target metadata.
