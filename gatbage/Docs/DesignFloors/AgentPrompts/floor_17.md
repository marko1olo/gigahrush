# FLOOR17_DARK_METRO_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `dark_metro` geometry owner, z=24.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/dark_metro.md`, `src/gen/design_floors/dark_metro.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/dark_metro.ts`, dark-metro helpers, `Docs/Tasks/Status_FLOOR17_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR17_GEOMETRY.md`.

Allowed with caution: isolated `dark_metro` call-out.

Forbidden: no full train simulation, no renderer darkness rewrite, no global lift route edits.

## Geometry Goal

Make a wrong metro interchange: long platforms, track trenches, service tunnels, switch rooms, dead train shells, ticket halls and black maintenance passages.

## Tasks

1. Generate platform-and-track macro geometry with parallel routes and crossovers.
2. Add station halls as landmarks and tunnel sections as risk corridors with limited light.
3. Create route choices: walk platform, cross track trench, use service tunnel, restore/bypass light.
4. Add motifs: platform island, track trench, ticket hall, switch room, dead carriage, service stair.
5. Make darkness pressure readable without making navigation impossible.
6. Run `npm run check`.

## Done Means

The floor plays like an underground transit maze with platforms, tracks and service routes shaping every decision.
