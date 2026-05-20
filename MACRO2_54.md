# MACRO2_54: Contract Target Marker Clarity

Модель: GPT-5.5, reasoning extra high.

Цель: system assignments are as readable on map/quest UI as plot quests, including procedural and route-floor targets.

Критично: contracts are the main repeatable expedition driver; vague targets reduce them to text errands.

Ownership: `src/systems/contracts.ts`, `src/render/quest_ui.ts`, `src/render/map_ui.ts`, `src/data/contracts.ts`, `tests/content-registry.test.ts`.

Читать: `desdoc.md P0.3`, `src/data/contracts.ts`, `src/systems/quests.ts`.

Deliverables:
- marker model for floor/room/zoneTag/designFloorId/procedural tag;
- target hint in quest log includes route and risk;
- completion/failure event remains structured.

Проверки: `npm run test:unit`, debug spawn verification contract.

Параллельные ограничения: do not reintroduce a separate player-facing "contract" UI model.
