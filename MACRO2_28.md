# MACRO2_28: Walkable Placement Helper

Модель: GPT-5.5, reasoning extra high.

Цель: единый helper для placement на reachable walkable cells after final geometry, not just random floor-ish cells.

Критично: NPC, loot, monsters and anomaly artifacts on blocked islands silently waste content and confuse contracts.

Ownership: `src/gen/procedural_floor.ts`, `src/gen/procedural_anomalies/common.ts`, `src/gen/shared.ts`, `tests/procedural-floors.test.ts`.

Читать: `architecture.md`, `src/gen/shared.ts`, `src/core/world.ts`.

Deliverables:
- helper returns reachable floor/water/door-adjacent valid cells with radius/bias;
- procedural NPC/loot/monster/anomaly drops use it;
- test asserts zero blocked entities/items for audited seeds.

Проверки: `npm run test:unit`, `npm run typecheck`.

Параллельные ограничения: use toroidal helpers; no full-world runtime scans.
