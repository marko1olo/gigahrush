# FLOOR16_COLLECTORS_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `FloorLevel.MAINTENANCE` / Collectors geometry owner, z=20 story anchor.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/collectors.md`, `src/gen/maintenance/index.ts`, `src/gen/maintenance/content_manifest.ts`, `src/entities/tube_eel.ts`.

## Owned Write Scope

Owned: `src/gen/maintenance/index.ts`, optional `src/gen/maintenance/geometry.ts`, maintenance/collector helpers, `Docs/Tasks/Status_FLOOR16_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR16_GEOMETRY.md`.

Allowed with caution: `src/gen/maintenance/content_manifest.ts` only to keep content attached to the new layout.

Forbidden: no fluid simulation, no global water economy rewrite, no uncapped monster spawning.

## Geometry Goal

Make the collectors a wet industrial labyrinth: pipe tunnels, water channels, valve rooms, pressure locks, culverts, flooded basins, pump stations and dry maintenance ledges.

## Tasks

1. Strengthen the water/pipe macro topology so water routes, dry routes and valve chokepoints are visibly different.
2. Add pressure-lock rooms and culvert shortcuts that support repair, drain, fight, dive or flee decisions.
3. Place landmarks to prevent pipe-maze fatigue: pump station, outpost, valve cross, flooded basin, heatline/pressure bridge.
4. Keep tube-monster encounter spaces bounded and readable.
5. Preserve existing maintenance content and lift connectivity.
6. Run `npm run check`.

## Done Means

Collectors feel like a water-pressure machine, not a generic maintenance maze with occasional water tiles.
