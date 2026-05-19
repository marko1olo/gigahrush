# Status MONSTER_22_CHERNOBOZHIY_SVOD

Task: implement `chernobozhiy_svod` / Чернобожий Свод as a cult-owned room anchor encounter.

Preflight:
- XML prompt extracted by CLI from `Monster_22.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source files: `cult_supply_kitchen.ts`, `cult_held_workshop.ts`, `chernobog_docket.ts`, `procedural_floors.ts`, `idol.ts`, `events.ts`.
- Baseline validation before edits: `npm run typecheck` exited 0 with no TypeScript diagnostics.

Implementation:
- Added `src/gen/kvartiry/chernobozhiy_svod.ts`.
- Integrated through `src/gen/kvartiry/content_manifest.ts`.
- Added focused test `tests/monster_22_chernobozhiy_svod.test.ts`.

Design coverage:
- Room anchor: bounded Kvartiry `COMMON` POI named `Тихий блок: Чернобожий Свод`.
- Warning: aligned black-hand surface marks, false-shelter screen, organized cult cache.
- Noncombat paths: expose evidence, seal marker with cleaning kit, sabotage supply list, rob cache with event consequence.
- Combat pressure: existing `IDOL` and `SHADOW` spawned inside the marked room after the warning structure is visible.
- Event residue: quest outcomes and cache theft publish through `systems/events.ts` with `monster`, `cult`, `chernobog`, `false_safe_block` tags.

Validation:
- Post-edit `npm run typecheck` exited 0 before later unrelated untracked Monster_23 files entered the typecheck path.
- Focused `npx tsx --test tests/monster_22_chernobozhiy_svod.test.ts` passed: 1 test, 0 failures.
- `npm run test:unit -- tests/monster_22_chernobozhiy_svod.test.ts` ran the full `tests/*.test.ts` script plus the focused file; the Svod test passed, but the run failed in unrelated untracked `tests/monster_16_ekrannik.test.ts` (`world.screenCells.length`: expected 3, actual 2).
- `npm run check` was attempted and stopped in typecheck on unrelated untracked `src/gen/ministry/matka_dokumentov.ts(256,9): error TS6133: 'cy' is declared but its value is never read.`
