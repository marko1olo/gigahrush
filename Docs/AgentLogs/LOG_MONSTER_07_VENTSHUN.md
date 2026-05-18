# LOG MONSTER_07_VENTSHUN

2026-05-18

Implemented `ventshun` / `Вентшун` as a local Maintenance vent predator setup.

Files changed:

- `src/gen/maintenance/ventshun.ts`
- `src/gen/maintenance/content_manifest.ts`
- `Docs/Tasks/Status_MONSTER_07_VENTSHUN.md`
- `Docs/AgentLogs/LOG_MONSTER_07_VENTSHUN.md`

Summary:

- Added a marked vent room with three dusty grate cells, a safe valve strip, and a reward niche.
- Used existing route cue runtime for warning/audio/HUD/event publication.
- Added bounded event-observer runtime local to this module, matching existing content patterns.
- Spawn is delayed until the player follows the cue into the vent target or loots after being warned.
- Threats are capped at three and use existing `TUBE_EEL` / `SBORKA` monsters.
- Counterplay exists through leaving the vent area before commitment, using the valve container, bait/noise against spawned monsters, or killing the capped burst.
- Clearing/sealing/killing publishes structured events tagged `monster`, `vent`, `ambush`, `maintenance`, `ventshun`.

Validation:

- Baseline `npm run typecheck`: exit code 0.
- Post-implementation `npm run typecheck`: exit code 0.
- `npm run check`: blocked by unrelated dirty-worktree type errors in other agents' files, first observed in `src/gen/void/perestanovshchik.ts`; subsequent typecheck showed unrelated errors in `src/gen/living/samosbornyy_ostov.ts` and `src/gen/maintenance/pressovik.ts`.
- Separate `npm run build`: exit code 0; Vite transformed 329 modules and emitted `dist/index.html`.
