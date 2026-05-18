# LOG_AG20_ELEVATOR404

## 2026-05-17

What was wrong: Elevator Loop 404 existed as design/docs, but live floor travel had only stable `FloorLevel` transitions. Numbered floors could not be inspected or saved as route metadata.

What was done: Added 8 data-only numbered elevator instances in `src/data/floor_instances.ts` and a small runtime state/route system in `src/systems/floor_instances.ts`. `main.ts` now resolves lift travel through that system, keeps normal travel common, and lets rare anomalies redirect to a base generator while showing the numbered instance name. Save/load persists optional instance state and tolerates old saves. HUD, minimap/full map and debug expose active instance state. README now documents the shipped behavior.

Cinematic cheats used: Numbered floors are route/display metadata over existing generators, not simulated parallel worlds. The wrong floor is communicated through messages, labels, events and NPC memory instead of generating bespoke pocket geometry.

Validation: Baseline `npm run build` passed. Post-change `npm run build` passed. `npm run smoke` passed with lit HUD/WebGL pixels. Latest standalone `npm run typecheck` is blocked by unrelated `src/data/dialogue.ts` errors. `npm run check` was started and failed outside AG20 scope in unit data-id tests because several quests/contracts reference `money` as an item id.
