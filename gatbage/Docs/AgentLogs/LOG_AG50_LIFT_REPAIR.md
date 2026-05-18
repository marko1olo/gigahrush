# AG50 Maintenance Lift Repair Shaft

Prompt: `AGENT_50_MAINT_LIFT_REPAIR_SHAFT`

Summary:
- Added a Maintenance repair shaft expedition centered on N-089 lift instability.
- The POI stamps a control room, reachable shaft corridor, and tool room through the maintenance content manifest.
- The encounter offers repair/reroute/loot decisions through existing side quest, item, contract, rumor, monster and container systems.

Changed:
- `src/gen/maintenance/lift_repair_shaft.ts`
- `src/gen/maintenance/content_manifest.ts`
- `src/data/contracts.ts`
- `src/data/rumors.ts`
- `Docs/Tasks/Status_AG50_LIFT_REPAIR.md`

Gameplay:
- Sаша Тросовая gives inspection, fuse-replacement and guide-clearing tasks.
- Старшина Рельс gives override-form and lampovy cleanup tasks.
- The shaft spawns repair machines, screens, lamps, tools, tech loot, an owned N-089 tool locker and a bounded Maintenance monster pack.
- Contracts now point players toward N-089 fuse repair and lift-shaft cleanup.
- Rumors now point to numbered lift instability and the N-089 repair shaft.

Validation:
- Baseline `npm run build`: passed before implementation.
- Post-change `npm run build`: passed.
- Targeted AG50 connectivity BFS: passed across 8 generated Maintenance floors; AG50 interiors, doors, connector path cells and owner locker were reachable from spawn.
- `npm run check`: failed during typecheck on unrelated existing `src/systems/rumor.ts` errors.
- Separate `npm run smoke`: failed on existing start-floor WebGL blank-canvas / inventory-panel checks, not Maintenance generation.
