# AG52 Maintenance Pressure Puzzle

Prompt: `AGENT_52_MAINT_PRESSURE_PUZZLE`

Summary:
- Strengthened Heatline Zero into a bounded pressure repair puzzle without continuous simulation.
- Added full repair, risky shortcut, already-resolved and failure outcomes through `src/systems/heatline.ts`.
- Used static room fog, steam residue stamps, room renames, HUD messages, inventory rewards and structured world events for feedback.
- Added player-facing pointers through contract `maint_heatline_valve_tag`, rumor `maint_heatline_manual_reroute`, and Heatline NPC dialogue.
- Wired the pressure interaction into the normal `E` world interaction path.
- Documented the shipped behavior in `README.md`.

Files:
- `src/systems/heatline.ts`
- `src/gen/maintenance/heatline_zero.ts`
- `src/main.ts`
- `src/data/contracts.ts`
- `src/data/rumors.ts`
- `README.md`
- `Docs/Tasks/Status_AG52_PRESSURE_PUZZLE.md`

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run check`: passed.
- Post-cleanup `npm run typecheck`: passed.

Notes:
- No new core enum or pressure simulation was added.
- Earlier overlapping validation processes produced stale smoke/typecheck output; after cleanup, a single controlled `npm run check` passed.
