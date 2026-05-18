# MONSTER_49_KOSTOREZ_AUDIT Status

Status: complete
Date: 2026-05-18

## Scope

- Prompt: `Monster_49.md`
- Owned code: `src/entities/kostorez.ts`
- Shared AI file `src/systems/ai/monster.ts` was read only.

## Preflight

- Read required docs: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `src/entities/kostorez.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/kostorez_locker.ts`.
- Baseline `npm run typecheck`: passed.

## Audit Notes

- Local definition already placed Kostorez on `MAINTENANCE` and `HELL`, matching the rare elite role in README and ecology.
- Local sprite already communicates the role through raised bone-saw forearms and a tall cutting silhouette.
- AI branch remains readable: it warns on sight, starts a 1.35 second windup inside 2.25 cells, aborts the burst if target distance or obstacle breaks line, and publishes events for sightings, escapes, armor cuts, and shotgun interrupts.
- Shotgun stagger is preserved through pellet projectile handling.
- Armor-sheet interaction is preserved: `metal_sheet` is consumed to reduce one cut.

## Change

- Sharpened local `counterplay` so it explicitly names distance, corner/column, shotgun stagger, and metal-sheet mitigation.
- Sharpened local `lootHint` to align with the `metal_sheet` item and rebar drops.

## Verification

- Post-edit `npm run typecheck`: passed.
- `npm run check` not run because behavior/system AI was not edited.
