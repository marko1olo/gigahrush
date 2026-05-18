# AG51 Water Bridge Status

Prompt: `AGENT_51_MAINT_WATER_BRIDGE_SHOOTER`

Preflight:
- Extracted the XML block from `Docs/AgentPrompts/AGENT_51_MAINT_WATER_BRIDGE_SHOOTER.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` P0.1/P0.2/P1, and the requested Maintenance, monster, weapon, contract and rumor files.
- Baseline `npm run build`: passed.

Implementation:
- Added `src/gen/maintenance/water_bridge.ts` as a bounded bridge-over-water POI with dry perimeter fallback, cross-bridges, pipe cover, two water lanes, two `TUBE_EEL` spawns and one `EYE`.
- Registered `generateWaterBridge()` in `src/gen/maintenance/content_manifest.ts`.
- Added contract `maint_water_bridge_eels` in `src/data/contracts.ts`.
- Added rumor `maint_water_bridge_dry_path` in `src/data/rumors.ts`.

Validation:
- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: blocked by unrelated `src/systems/faction_events.ts` errors during an intermediate run.
- `npm run check`: blocked at typecheck by unrelated `src/gen/ministry/document_gate.ts(11,1)` unused `Spr` import.
- Post-edit `npm run build`: passed.
- Post-edit `npm run smoke`: passed.
