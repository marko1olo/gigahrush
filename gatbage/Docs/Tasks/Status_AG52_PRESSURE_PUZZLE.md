# AG52 Maintenance Pressure Puzzle

Status: done.

Preflight:
- Prompt block `AGENT_52_MAINT_PRESSURE_PUZZLE` extracted from `Docs/AgentPrompts/AGENT_52_MAINT_PRESSURE_PUZZLE.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` P0.4/P1/P2, Maintenance pressure/heatline/steam modules, content helpers, `systems/heatline.ts`, contracts, rumors, and events.
- Baseline `npm run typecheck` passed before implementation edits.

Scope:
- Strengthen the existing Heatline Zero pressure/repair POI.
- Add bounded repair/reroute interaction state, static feedback, and structured events.
- Add one contract or rumor pointing players at the pressure puzzle.

Implemented:
- Added `tryUseHeatlinePressure()` as a bounded Maintenance interaction on Heatline Zero machines, apparatus and warning lamps.
- Repair path consumes `asbestos_cord` and `sealant_tube` when the player also has `manometer`, clears Heatline fog, marks rooms as pressure-resolved, grants `valve_tag` and `filtered_water`, and publishes a `player_use_item` event tagged `maintenance/heatline/pressure/repair`.
- Shortcut path consumes cord and sealant without the manometer, leaves the hot corridor partially fogged, damages the player, grants `valve_tag`, and publishes a shortcut event.
- Failure path vents static fog/steam marks, damages the player, logs missing parts, and publishes a failure event.
- Heatline Zero generation now places initial hot fog/steam residue and NPC hints for the repair/shortcut choice.
- Added Maintenance contract `maint_heatline_valve_tag` and rumor `maint_heatline_manual_reroute`.
- Wired the interaction into the existing `E` world-use path after metro routing and before normal doors/containers.
- Updated `README.md` with the shipped Heatline Zero pressure behavior.

Validation:
- Baseline `npm run typecheck` passed before implementation.
- Final `npm run check` passed: typecheck, unit tests, build, and smoke playability.
- Post-cleanup `npm run typecheck` passed after the cooldown reset tweak.
