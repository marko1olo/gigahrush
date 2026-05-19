# MONSTER_34_REBAR_AUDIT Status

Date: 2026-05-18

## Scope

- Owned code: `src/entities/rebar.ts`
- Read-only audit files checked: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/gen/design_floors/production_belt.ts`, `src/systems/ai/monster.ts`
- Baseline validation: `npm run typecheck` passed before edits.

## Result

`REBAR` / `Арматура` now carries local `MonsterDef` metadata for floors, counterplay and loot hint instead of relying only on shared ecology text. Its default stats were nudged toward an armored metal hazard: higher durability and hit damage, slower movement and slower attack cadence.

The procedural sprite was rebuilt for better metal readability:

- wider jagged rod silhouette;
- dark flat scrap base;
- concrete knots rather than organic chunks;
- cross-braces and shelf-flat bars;
- rust and bright metal edge contrast;
- small hot spark eyes/glints.

## Counterplay

Current local counterplay text emphasizes the required distinction:

- avoid straight iron near storage/shelves;
- back into wider passages;
- use distance;
- do not punch metal bare-handed.

This keeps `Арматура` distinct from corpse/loot ambush concepts such as `samosbornyy_ostov`, which belong to organic aftermath contexts.

## Placement Notes Outside Write Scope

- `src/gen/design_floors/production_belt.ts` already places a `REBAR` in the metal restoration line, which matches the production/storage role.
- Shared ecology in `src/data/monster_ecology.ts` already lists production, storage and corridor rooms with metal loot and rebar rumors.
- Some floor generators still use local REBAR overrides, for example Maintenance and Hell generator spawn tables. A future placement/balance owner can audit those overrides for consistency with the slower armored default.

## Validation

- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
- `git diff --check` for owned files: passed.
