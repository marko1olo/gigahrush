# FLOOR09_MANHATTAN_CROSSROADS_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `manhattan_crossroads` geometry owner, z=-8.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/manhattan_crossroads.md`, `src/gen/design_floors/manhattan_crossroads.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/manhattan_crossroads.ts`, crossroads-only helpers, `Docs/Tasks/Status_FLOOR09_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR09_GEOMETRY.md`.

Allowed with caution: isolated `manhattan_crossroads` call-out from `full_floor.ts`.

Forbidden: no vehicle simulation, no physics engine, no broad renderer changes.

## Geometry Goal

Make an indoor Manhattan road grid: asphalt corridors, block islands, storefront rooms, overpasses, underpasses, crosswalk plazas, traffic-light chokepoints and ambush alleys.

## Tasks

1. Generate a block-grid macro shape with roads as corridors and buildings as room islands.
2. Break grid monotony with diagonal service alleys, over/underpass-like alternate paths and blocked intersections.
3. Put meaningful decisions at intersections: repair signal, cross open lane, duck into storefront, bypass through alley.
4. Add motifs: crosswalk plaza, storefront block, traffic-light gate, road divider, underpass service tunnel.
5. Keep at least two independent routes across the floor.
6. Run `npm run check`.

## Done Means

The floor navigates like impossible streets inside concrete, with intersection choices and block-scale landmarks.
