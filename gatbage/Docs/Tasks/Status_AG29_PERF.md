# AG29 Performance Telemetry / Smoke Status

Agent: AGENT_29_PERF_TELEMETRY_SMOKE  
Domain: Performance / Smoke / Telemetry  
Task count: 8

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_29_PERF_TELEMETRY_SMOKE">` from `Docs/AgentPrompts/AGENT_29_PERF_TELEMETRY_SMOKE.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `optimization.md`.
- [x] Read `audit.md`.
- [x] Read `package.json`.
- [x] Read `scripts/`.
- [x] Read `tests/`.
- [x] Read `src/systems/debug.ts`.
- [x] Read `src/render/webgl.ts`.
- [x] Read `src/main.ts`.
- [x] Baseline `npm run typecheck` run: fails on pre-existing TypeScript errors outside AG29 write scope.
- [x] Baseline `npm run test:unit` run: fails on the same TypeScript gate before tests execute.
- [x] Baseline `npm run build` run: passes.
- [x] Baseline `npm run smoke` run: passes.
- [x] Final `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run smoke`, and `npm run check` pass on the current checkout.

## Checklist

- [x] Record actual commands: `typecheck`, `test:unit`, `build`, `smoke`, `check`.
- [x] Keep and strengthen browser smoke against blank HUD/WebGL canvas failure.
- [x] Add optional frame telemetry to smoke via `SMOKE_PERF_FRAMES`.
- [x] Add deterministic data id/reference unit checks for items, side quests, contracts, monster ecology, monster variants, resources, factories, containers, and floor catalog/instances.
- [ ] Add in-game update/render split counters.
- [x] Avoid hot-loop allocations or default runtime telemetry overhead.
- [x] Update factual docs for the new smoke telemetry switch.
- [x] Run full `npm run check`.
- [x] Run full `npm run check` green.

## Notes

- In-game update/render split counters were not added because collecting them would require editing `src/main.ts` and/or `src/render/webgl.ts`, which this prompt lists outside its absolute write scope.
- Optional smoke telemetry covers frame pacing externally without default runtime overhead.
