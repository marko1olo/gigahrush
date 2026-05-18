# LOG_AG107_HERMODOOR_BORER

## 2026-05-18

Implemented AG107 hermodoor borer shelter-risk slice.

- Added `src/systems/hermodoor_borer.ts` with one active `Гермоточильщик`, one targeted door record, warning marks/sounds, sparse damage state and cleanup on rebuild/floor change.
- Integrated the borer into `src/systems/samosbor.ts` through a narrow update call and seal hook. A door only fails to seal after the borer has warned and damaged it.
- Added repair interaction in `src/main.ts`: looking at the marked door and pressing `E` repairs with `sealant_tube`, `hermo_gasket` or `wrench`.
- Added counterplay: kill before damage, use light/UV to delay, close the target door as a trap, repair, or avoid that shelter.
- Added structured event types and world-log text for detected, damaged, repaired and compromised borer states.
- Added debug route `ГЕРМО: точильщик QA`, which grants the kit, spawns the borer, moves the player to the target and shortens the next samosbor warning route.

Validation:

- `npm run typecheck` baseline failed because `package.json` defines only `dev`, `build` and `preview`.
- `npm run check` failed for the same reason: missing npm script.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
