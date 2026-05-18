# AG51 Water Bridge Final Report

Date: 2026-05-17

Implemented:
- Added `src/gen/maintenance/water_bridge.ts`.
- Wired `generateWaterBridge()` through `src/gen/maintenance/content_manifest.ts`.
- Added Maintenance contract `maint_water_bridge_eels`.
- Added rumor `maint_water_bridge_dry_path`.

Gameplay result:
- The POI stamps a reachable dry bridge over two water lanes.
- The player has dry perimeter fallback, center bridge movement, crosswalks and pipe cover.
- Two `TUBE_EEL` monsters start in water so the dry-path counterplay is visible.
- One `EYE` pressures open sight lines without making the entrance an unavoidable lethal trap.
- Rewards are placed on the far dry side: 9mm ammo and filtered water, with a nearby note/clue marker.

Validation:
- Baseline `npm run build`: passed.
- `npm run check`: failed before tests/build/smoke at typecheck due unrelated `src/gen/ministry/document_gate.ts(11,1)` unused `Spr` import. An intermediate `npm run typecheck` also reported unrelated `src/systems/faction_events.ts` errors.
- Post-edit `npm run build`: passed.
- Post-edit `npm run smoke`: passed.
