# AG92 Maronary Wrong Door Log

## 2026-05-18

- Implemented bounded one-shot wrong-door remap in `src/systems/wrong_door.ts`.
- Hooked creation into Maronary samosbor start, using the existing warning door when possible.
- Hooked consumption into player movement before generic `world.anomalyTeleports` handling.
- Added expiry cleanup during samosbor rebuild, lifecycle event publication, log text, debug forcing, and green map cues.
- Added `tests/wrong-door.test.ts` for pure route selection/validation helpers.
- Validation notes: `npm run typecheck` and `npm run check` are unavailable in this checkout because `package.json` only defines `dev`, `build`, and `preview`. Direct `npx tsc -p tsconfig.json` currently fails on unrelated in-progress worktree errors. `npm run build` also fails before AG92 code on duplicate exports in `src/systems/procedural_anomalies.ts`.
