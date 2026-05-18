# LOG MONSTER_09_PRESSOVIK

## 2026-05-18

Implemented `pressovik` / `Прессовик` as a maintenance production-line room rule.

Files changed:
- `src/gen/maintenance/pressovik.ts`
- `src/gen/maintenance/content_manifest.ts`
- `tests/monster_09_pressovik.test.ts`
- `Docs/Tasks/Status_MONSTER_09_PRESSOVIK.md`
- `Docs/AgentLogs/LOG_MONSTER_09_PRESSOVIK.md`

Gameplay result:
- The encounter adds a visible press line with red unsafe plates, white safe lanes, warning lamps, screens, side cover, and a service bypass.
- Unsafe plates use the existing bounded `cell_hazards` system, producing forced-retreat pressure without hidden instant death.
- A stop quest from Нина Стопорная and a stop-container deposit path can clear the press hazards.
- Existing `SBORKA`, `REBAR`, and `ROBOT` monsters create pressure around the line.
- Output cassette gives `gear`, `spring`, and `metal_sheet` traces and publishes a crossed production event.
- Hazard trap, machine stop, and crossed outcomes publish through `systems/events.ts` using existing event types and tags `monster`, `press`, `timing`, `production`.

Validation:
- Baseline `npm run typecheck` before edits: exit 0.
- `npx tsx --test tests/monster_09_pressovik.test.ts`: exit 0, 2 tests passed.
- Final `npm run typecheck`: exit 0.
- `npm run check`: exit 0; 102 unit tests passed and Vite build completed.
