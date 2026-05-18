# FLOOR14_PRODUCTION_BELT Status

## Scope

- Owned module: `src/gen/design_floors/production_belt.ts`
- Goal: authored production floor prototype with static factory lines, output containers, NPC quest surface and bounded production hooks.
- Constraint: no live conveyor physics, no per-frame scans, no rewrites of production or economy systems.

## Checklist

- [x] Read prompt and required project docs.
- [x] Read production, factory, resource, maintenance POI and container references.
- [x] Baseline `npm run build`.
- [x] Implement generator module.
- [x] Run `npm run check`.
- [x] Append final report.

## Notes

- The repository was already heavily dirty before this task, including many untracked source and docs files.
- Existing production registration is room-driven: `RoomType.PRODUCTION` plus a factory name hint and a reachable output container.
- Debug travel wiring is integrator-owned; this task will expose a generator and deterministic exported helpers inside the owned design-floor module.
- Baseline build passed before source edits.
- `npm run check` passed after implementation.
- Direct generator sanity check returned 12 rooms, 24 entities, 4 named NPCs, 3 production rooms and 3 production output containers.
