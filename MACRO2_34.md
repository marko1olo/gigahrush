# MACRO2_34: Non-Living AptMask And HermoWall Preservation

Модель: GPT-5.5, reasoning extra high.

Цель: protected authored shelters and hermetic walls survive samosbor rebuilds outside Living.

Критично: shelter choice is core gameplay; losing protection after rebuild turns authored safe rooms into fake UI promises.

Ownership: `src/systems/samosbor.ts`, `src/gen/design_floors/*.ts` only where tests prove a local bug, `tests/samosbor-shelter.test.ts`.

Читать: `README.md Starting Area`, `README.md Samosbor`, `src/core/world.ts`.

Deliverables:
- before/after tests for `aptMask`/`hermoWall` on Floor 69, Roof, Service/Metro if applicable;
- clear rule: which floors intentionally use protection arrays;
- no stale protection on regenerated volatile walls.

Проверки: `npm run test:unit`.

Параллельные ограничения: do not globally mark authored floors safe; protect only meaningful shelters/POI.
