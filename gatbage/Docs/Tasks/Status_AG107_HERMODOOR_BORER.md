# Status_AG107_HERMODOOR_BORER

## Prompt

- Extracted XML block id: `AGENT_107_HERMODOOR_BORER`.
- Domain: Monster / Samosbor Shelter Risk / Repair.
- Goal: add a bounded hermodoor borer threat that can damage one shelter/hermodoor before or after samosbor, with warning and repair/counterplay.

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` section 16.6.
- Read `src/systems/samosbor.ts`.
- Read `src/core/types.ts`.
- Read `src/entities/monster.ts`.
- Read `src/systems/events.ts`.
- Read `src/gen/living/hermoseam_station.ts`.
- Read `src/gen/maintenance/lift_repair_shaft.ts`.
- Baseline requested command: `npm run typecheck` failed because `package.json` has no `typecheck` script.

## Implementation

- Added `src/systems/hermodoor_borer.ts` as a sparse, world-local runtime for one active borer and one targeted door record.
- The borer targets one generated door/shelter, stamps visible scrape/scorch marks, plays local break/door sounds and publishes structured events.
- Counterplay paths:
  - detect the warning marks/sound and choose another shelter;
  - kill the spawned `Гермоточильщик` before damage;
  - equip light/UV to delay damage;
  - close the target door as a trap to hurt/delay it;
  - repair with `sealant_tube`, `hermo_gasket` or `wrench`.
- Added a narrow samosbor seal hook: a door only fails during sealing if it was already warned and damaged.
- Repair during active samosbor reseals every door in that room instead of leaving a partially unsafe shelter.
- Added a debug command `ГЕРМО: точильщик QA` that grants the needed kit, spawns the encounter, moves the player to the target door and shortens the next warning route.

## Events

- Added event types:
  - `hermodoor_borer_detected`
  - `hermodoor_borer_damage`
  - `hermodoor_borer_repaired`
  - `hermodoor_borer_compromised`
- Added world-log text for those events.

## Verification

- `npm run typecheck`: failed before code changes; missing npm script.
- `npm run check`: failed after implementation; missing npm script.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.

## Done Criteria

- Shelter safety is questioned only after readable warning.
- Player has prevent, repair, trap/light/UV/kill, and avoid choices.
- Door state remains local and bounded; no global durability simulation was added.
