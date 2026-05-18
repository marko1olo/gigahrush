# Status_AG20_ELEVATOR404

Agent: AGENT_20_ELEVATOR_LOOP_404  
Domain: Elevator Loop 404 / Numbered Floor Instances  
Date: 2026-05-17  
Prompt source: `Docs/AgentPrompts/AGENT_20_ELEVATOR_LOOP_404.md`

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_20_ELEVATOR_LOOP_404">`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `Docs/Expansions/09_elevator_loop_404/expansion.md`.
- [x] Read `src/gen/floor_manifest.ts`.
- [x] Read `src/main.ts` floor switching/save-load sections.
- [x] Read `src/core/types.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Read `src/render/map_ui.ts`.
- [x] Baseline `npm run build`: passed before edits.

## Implementation

- [x] Added `src/data/floor_instances.ts` with 8 numbered, data-only instances mapped onto existing `FloorLevel` generators.
- [x] Added `src/systems/floor_instances.ts` for optional save state, route resolution, anomaly events, debug summaries and NPC rumor memory.
- [x] Wired elevator switching in `src/main.ts` so normal travel remains common and rare anomalies redirect to an instance base floor.
- [x] Save/load now includes tolerant `floorInstances` state and falls back to stable floors if missing or invalid.
- [x] HUD, minimap/full map and debug overlay show the active instance label.
- [x] Debug command «Лифтовые инстансы» lists active/discovered/anomaly state.
- [x] README updated with shipped facts.

## Validation

- [x] Baseline `npm run build`: passed.
- [x] Post-change `npm run build`: passed.
- [x] `npm run smoke`: passed (`hudLit=36864`, `webglLit=1024`).
- [!] `npm run typecheck`: currently blocked by unrelated `src/data/dialogue.ts` unused imports / missing `observeRecentRumorEventsForNpc`.
- [!] `npm run check`: started and failed outside AG20 scope. In that run, typecheck advanced to unit tests, then `tests/data-ids.test.ts` failed because `money` is referenced as a quest/contract item id by `ag15_ilya_pay_debt`, `rotenbergov_taxes` and `bm88_debt_payment`.

## Notes

- No numbered `FloorLevel` enum values were added.
- No background floor generation was added.
- Active instances reuse existing floor generation and only carry route/display/save metadata.
