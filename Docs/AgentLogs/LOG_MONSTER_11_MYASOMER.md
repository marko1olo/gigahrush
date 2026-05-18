# MONSTER_11_MYASOMER Log

2026-05-18

Implemented `myasomer` / `Мясомер` as a local Hell aftermath noise-discipline encounter.

Changed files:
- `src/gen/hell/myasomer.ts`
- `src/gen/hell/content_manifest.ts`
- `tests/monster_11_myasomer.test.ts`
- `Docs/Tasks/Status_MONSTER_11_MYASOMER.md`
- `Docs/AgentLogs/LOG_MONSTER_11_MYASOMER.md`

Behavior:
- Adds `Коридор Мясомера` on Hell generation with meat/gut textures, cover ribs, meat marks, a quiet cache, a siren-shard cache, and a local bait item.
- Quiet cache gives raw meat, water, and a bandage and publishes a `myasomer_quiet_clear` event if used before loud triggers.
- Taking from the siren-shard cache escalates local warnings, then spawns capped existing pressure (`SHADOW` and `SBORKA`) after repeated local triggers.
- Local bait placement inside the encounter marks counterplay and reduces spawned pressure.
- Fire cleanup/collateral damage inside the encounter is also treated as local noise.
- Loud-clear is published after the spawned Myasomer pressure is killed.

Constraints:
- No broad acoustic simulation.
- No global firing punishment.
- Runtime work is event-driven and local to the active generated site.

Validation:
- Baseline `npm run typecheck`: passed before changes.
- Focused `npx tsx --test tests/monster_11_myasomer.test.ts`: passed 3 tests.
- Post-change `npm run typecheck` and `npm run check` are blocked by unrelated untracked `src/gen/maintenance/chernaya_lichinka.ts` with `TS2304: Cannot find name 'TAG_WITNESS'`.
