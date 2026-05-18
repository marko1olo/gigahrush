# AG50 Maintenance Lift Repair Shaft

Status: implemented with global validation blockers outside AG50 scope.

Preflight:
- Prompt block `AGENT_50_MAINT_LIFT_REPAIR_SHAFT` extracted from `Docs/AgentPrompts/AGENT_50_MAINT_LIFT_REPAIR_SHAFT.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` P1/P2, maintenance content helpers/manifest, metro error line, floor instance data/system, contracts, rumors, and containers.
- Baseline `npm run build` passed before implementation edits.

Scope:
- Add one Maintenance repair shaft expedition module.
- Register it through the maintenance manifest.
- Add contracts and rumors that point to lift instability and the shaft.
- Avoid lift transition/topology rewrites and avoid any softlock route.

Implemented:
- Added `src/gen/maintenance/lift_repair_shaft.ts`.
- Registered `generateLiftRepairShaft()` in `src/gen/maintenance/content_manifest.ts`.
- Added shaft side quests for inspection, repair fuses, clearing guide monsters, override paperwork and lampovy cleanup.
- Added an owned tool locker with lift/tech loot and theft semantics.
- Added Maintenance contracts for N-089 fuse repair and shaft combat cleanup.
- Added rumors for numbered-lift instability and the N-089 repair shaft.

Validation:
- Baseline `npm run build`: passed.
- Post-change `npm run build`: passed.
- Targeted AG50 connectivity BFS: passed across 8 generated Maintenance floors; AG50 room interiors, doors, connector path cells and owner locker were reachable from spawn.
- `npm run check`: blocked in `npm run typecheck` by existing unrelated errors in `src/systems/rumor.ts`.
- Separate `npm run smoke`: failed on existing start-floor WebGL sampling / inventory-panel checks, not on Maintenance generation.
