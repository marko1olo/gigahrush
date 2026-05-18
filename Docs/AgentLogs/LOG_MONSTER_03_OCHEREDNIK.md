# LOG MONSTER_03_OCHEREDNIK

2026-05-18

Implemented `ocherednik` as a Kvartiry social monster encounter rather than a new melee stat block.

Files changed:

- `src/gen/kvartiry/ocherednik.ts`
- `src/gen/kvartiry/content_manifest.ts`
- `Docs/Tasks/Status_MONSTER_03_OCHEREDNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_03_OCHEREDNIK.md`

Gameplay result:

- The player can see the threat through unmoving queue numbers, ration papers, witnesses, and a named `NELYUD` queue leader.
- The direct route is obstructed, but a lit side route exists.
- Coupon handling, exposing the fake leader, stealing ration papers, or fighting through all use existing quest/container/event systems.
- The violent branch publishes a witnessed quest-completion event tagged with `ocherednik`, `monster`, `queue`, `ration`, `witness`, and `violence`, and applies a negative citizen relation delta.

Validation:

- Baseline `npm run typecheck`: passed with exit 0 before source edits.
- Post-implementation `npm run typecheck`: failed with exit 2 due unused `Cell` and `TAGS` in `src/gen/void/perestanovshchik.ts`, which is outside this task's write scope.
- `npm run check`: failed in typecheck with exit 2 due `weapon` on `PlotNpcDef` in untracked `src/gen/living/golos_za_dveryu.ts`.
- Final `npm run typecheck` re-run: failed with exit 2 due `number | undefined` passed to `dist2` in untracked `src/gen/living/plombirovshchik.ts`.
- Focused Kvartiry generator import/run: passed; generated `Коридор неподвижной очереди` and `Первый номер`. It also printed duplicate zone HUD warnings from unrelated Living zone-content modules.
