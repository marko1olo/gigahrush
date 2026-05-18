# FLOOR09_GEOMETRY Status

Date: 2026-05-18

Changed files:
- `src/gen/design_floors/manhattan_crossroads.ts`
- `src/gen/design_floors/full_floor.ts`
- `gatbage/Docs/Tasks/Status_FLOOR09_GEOMETRY.md`
- `gatbage/Docs/AgentLogs/LOG_FLOOR09_GEOMETRY.md`

Macro geometry: `manhattan_crossroads` now generates a larger indoor street grid with five authored central avenues, five cross streets, a routed wrong-turn spur, a full-floor shell grid, storefront block rooms, diagonal service alleys, barricaded intersections, a tile overpass bypass and a concrete underpass tunnel. The full-floor expansion now calls the Manhattan-owned shell helper instead of the generic random block expander, so route-scale roads no longer stamp over authored POIs like the cargo garage.

Approximate counts from focused generation smoke:
- 27 rooms, 16 entities, 3 containers.
- 240234 floor cells and 23 door cells.
- 3 lift cells, all adjacent to the reachable graph.
- 5 checked named POIs kept owned center cells: control post, cargo garage, wrong-turn spur, safe curb and underpass.

Integration notes:
- `full_floor.ts` has an isolated `manhattan_crossroads` call-out to `expandManhattanCrossroadsRouteShell`.
- No new `FloorLevel`, renderer hook, physics simulation, dependency or runtime system was added.

Validation:
- `npx tsx` focused generation smoke: passed.
- `npm run check`: passed after clearing stale duplicate/dead helpers already present in `full_floor.ts`; typecheck, 65 unit tests and Vite build all completed.
