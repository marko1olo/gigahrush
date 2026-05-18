# LOG_AG72_SCIENTIST_ESCORT

## 2026-05-18

- Implemented AG72 as an escort-like illusion built from side quests, TALK target markers, route metadata and a locked sample room.
- Added generic authored-quest metadata in `src/systems/quests.ts` / `src/data/plot.ts` / `src/core/types.ts`:
  - route hints on authored quests,
  - side-quest event tags,
  - protected plot NPC failure,
  - branch completion that abandons named side quests,
  - side-quest `spawnMonstersOnAccept` support.
- Added Living content module `src/gen/living/scientist_escort_sample.ts`.
- Added `slime_sample_fake` and `slime_sample_contaminated` item ids and registered them under `slime_samples`.
- Baseline `npm run typecheck` was blocked because the current `package.json` does not define that script.
- Final `npm run check` was blocked because the current `package.json` does not define that script.
- Direct `npx tsc --noEmit --pretty false` failed only on out-of-scope current-tree errors in `src/gen/maintenance/pneumomail_station.ts` and `src/systems/govnyak.ts`.
- `npm run build` passed and produced `dist/index.html`.
