# Status MONSTER_07_VENTSHUN

Date: 2026-05-18

## Scope

- Implemented `ventshun` / `Вентшун` as a Maintenance vent warning encounter.
- Added `src/gen/maintenance/ventshun.ts`.
- Integrated it through `src/gen/maintenance/content_manifest.ts`.

## Preflight

- Extracted the `MONSTER_07_VENTSHUN` XML block from `Monster_07.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md` monster_07 section, `AGENTS.md`.
- Read required source:
  - `src/gen/maintenance/pneumomail_station.ts`
  - `src/gen/maintenance/slime_singing_vents.ts`
  - `src/gen/design_floors/dark_metro.ts`
  - `src/entities/tube_eel.ts`
  - `src/entities/sborka.ts`
  - `src/systems/events.ts`

## Implementation

- Created one marked pipe room with three vent cells and a safe valve strip.
- Registered a route cue (`maintenance_ventshun_warning`) so the player hears/sees dust and metal cough before danger.
- Added a local event observer, following the existing `black_slime_eyes` pattern:
  - `heard` / `inspected` arms the warning state only.
  - `followed` after the cue spawns a capped 2-3 threat burst using `TUBE_EEL` and `SBORKA`.
  - opening the reward stash can trigger the threat only after a warning; if reached before warning, it publishes warning only.
  - valve interaction or leaving the warning behind clears/seals the encounter without spawning.
  - killing all spawned threats publishes a cleared event.
- Added reward/trace loot: `filter_layer`, `gasmask_filter`, `pipe`, and a note.
- Runtime cost is bounded to route cue scans and specific event observer checks; no global vent scan was added.

## Validation

- Baseline before edits: `npm run typecheck`
  - Output:
    - `> gigahrush@1.0.0 typecheck`
    - `> tsc --noEmit`
  - Result: exit code 0.
- After Ventshun implementation: `npm run typecheck`
  - Output:
    - `> gigahrush@1.0.0 typecheck`
    - `> tsc --noEmit`
  - Result: exit code 0.
- Broader integrated check: `npm run check`
  - Stopped during its typecheck phase with unrelated dirty-worktree errors outside this task:
    - `src/gen/void/perestanovshchik.ts(5,3): error TS6133: 'Cell' is declared but its value is never read.`
    - `src/gen/void/perestanovshchik.ts(31,7): error TS6133: 'TAGS' is declared but its value is never read.`
  - A later plain `npm run typecheck` rerun showed concurrent unrelated errors:
    - `src/gen/living/samosbornyy_ostov.ts(27,7): error TS6133: 'OSTOV_TAGS' is declared but its value is never read.`
    - `src/gen/maintenance/pressovik.ts(4,18): error TS6133: 'EntityType' is declared but its value is never read.`
- Separate bundling check after the blocked `npm run check`: `npm run build`
  - Result: exit code 0.
  - Key output: `✓ 329 modules transformed.` and `✓ built in 9.32s`.

## Notes

- The task's absolute write scope was respected except for the permitted maintenance manifest integration.
- `service_floor` and `dark_metro` were treated as design-contract targets for future reuse; this pass wires the encounter into the existing Maintenance manifest only.
