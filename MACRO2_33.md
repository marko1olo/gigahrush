# MACRO2_33: Replace World Runtime State Contract

Модель: GPT-5.5, reasoning extra high.

Цель: centralize `World` replacement on rebuild/floor switch so runtime arrays/maps are copied/reset consistently.

Критично: samosbor rebuilds can lose or stale-copy `aptMask`, `hermoWall`, rail tracks, anomaly maps, screens, surfaces and dirty versions.

Ownership: `src/systems/samosbor.ts`, `src/core/world.ts`, `src/main.ts`, `tests/samosbor-shelter.test.ts`.

Читать: `src/systems/samosbor.ts`, `src/core/world.ts`, `src/gen/floor_manifest.ts`.

Deliverables:
- `replaceWorldFromGeneration` or equivalent single helper;
- tests for story/design/procedural rebuild state preservation/reset;
- dirty version bumps are correct after replacement.

Проверки: `npm run test:unit`, `npm run typecheck`.

Параллельные ограничения: core/world edits are integration work; keep API small.
