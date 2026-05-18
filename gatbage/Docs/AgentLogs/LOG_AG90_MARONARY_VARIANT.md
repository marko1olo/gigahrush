# AG90 Maronary Variant MVP Log

## 2026-05-18

Implemented a narrow Maronary MVP pass on top of the existing rare variant data.

Changed:

- Added `MarkType.MARONARY` with a green proof/source procedural mark.
- Added warning-time green source stamping and a bounded wrong-door clue in `systems/samosbor.ts`.
- Reused the existing one-shot wrong-door remap hook for Maronary start.
- Added `green_source` / `wrong_door` tags to Maronary warning/start/zone/aftermath events.
- Added active Maronary ping audio via `playMaronaryPing()`.
- Added bounded Maronary HUD proof noise and active title.
- Added explicit debug force command: `МАРОНАРИЙ: force + самосбор`.
- Added `maronary_shaving` -> `samosbor_maronary_shaving` rumor hook.
- Created `Docs/Tasks/Status_AG90_MARONARY_VARIANT.md`.

Validation:

- Baseline `npm run typecheck`: blocked because the script is missing from `package.json`.
- `npx tsc --noEmit`: blocked by existing unrelated worktree errors outside AG90 scope.
- `npm run check`: blocked because the script is missing from `package.json`.
- `npm run build`: blocked by existing unrelated missing export `tryUseProceduralFloorAnomaly` in `src/systems/procedural_anomalies.ts`.
- `git diff --check` on AG90-touched files: pass.
