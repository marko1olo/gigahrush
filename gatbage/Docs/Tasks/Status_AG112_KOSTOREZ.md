# AG112 Kostorez Status

Prompt extracted: `AGENT_112_KOSTOREZ_MELEE_ELITE`.

Domain: Monster / Rumors / Readable Windup.

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` section 16.6.
- Read `src/entities/monster.ts`.
- Read `src/systems/ai/monster.ts`.
- Read `src/systems/ai/combat.ts`.
- Read `src/data/monster_variants.ts`.
- Read `src/data/rumors.ts`.

## Baseline Validation

- `npm run typecheck`: blocked before edits. `package.json` currently exposes only `dev`, `build`, and `preview`; npm reported `Missing script: "typecheck"`.

## Implementation Notes

- Decision: Kostorez will be a new monster kind, not a cheap variant, because readable windup, interruption, burst resolution, and escape events need stateful AI.
- Counterplay target: distance break, obstacle dodge during windup, shotgun pellet stagger, and metal-sheet armor absorption.

## Completed

- Added `MonsterKind.KOSTOREZ`, monster registry entries, procedural sprite, base stats, ecology data, XP, and world-log naming.
- Added Kostorez AI branch with a 1.35s readable windup, visible sprite scale pose, growl/log cue, delayed burst, obstacle/distance cancellation, and shotgun pellet stagger.
- Added `monster_sighted`, `monster_windup_interrupted`, `monster_armor_cut`, and `monster_escaped` event publishing with Kostorez rumor ids.
- Added four static rumors/leads warning about cuts, windup, shotgun stagger, and the Maintenance encounter room.
- Added bounded Maintenance encounter room `Разрезочная бронелистов` with cut marks, metal-sheet/ammo reward, obstacle cover, and one Kostorez placed away from spawn.
- Updated README monster facts for Kostorez behavior.

## Validation

- `npm run typecheck`: blocked before edits; script missing from `package.json`.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, Vite built `dist/index.html`.
- `npm run smoke`: blocked; script missing from `package.json`.
- `npm run check`: blocked; script missing from `package.json`.
