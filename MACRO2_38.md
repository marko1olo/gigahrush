# MACRO2_38: Exact Floor Instance Return Route

Модель: GPT-5.5, reasoning extra high.

Цель: floor instance exit returns to exact intended route entry: z, key, designFloorId/procedural spec, not just base FloorLevel.

Критично: returning to wrong base floor breaks player mental map and can skip authored/procedural stops.

Ownership: `src/systems/floor_instances.ts`, `src/systems/procedural_floors.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Numbered Lift Instances`, `src/systems/procedural_floors.ts`.

Deliverables:
- instance state stores exact intended route entry;
- save/load preserves intended return;
- tests cover interruption from story, design and procedural floor.

Проверки: `npm run test:unit`.

Параллельные ограничения: no route span/cadence changes.
