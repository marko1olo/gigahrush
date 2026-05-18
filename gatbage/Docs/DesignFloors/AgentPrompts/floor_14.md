# FLOOR14_PRODUCTION_BELT_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `production_belt` geometry owner, z=12.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/production_belt.md`, `src/gen/design_floors/production_belt.ts`, `src/gen/design_floors/full_floor.ts`, `src/systems/production.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/production_belt.ts`, production-only helpers, `Docs/Tasks/Status_FLOOR14_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR14_GEOMETRY.md`.

Allowed with caution: isolated `production_belt` call-out if needed.

Forbidden: no production-system rewrite, no unbounded item output, no physics conveyor simulation.

## Geometry Goal

Make a factory belt: machine halls, conveyor-like corridors, loading docks, shift gates, maintenance catwalks, storage bays and dangerous repair shortcuts.

## Tasks

1. Generate long production lines as corridors with side rooms and periodic machine blockages.
2. Add loading dock loops and maintenance bypasses so players can choose work route, theft route or repair route.
3. Place production rooms in geometry that supports output containers and visible scarcity consequences.
4. Add motifs: conveyor hall, machine island, shift gate, loading dock, maintenance catwalk, scrap pocket.
5. Keep all generated rewards bounded and reachable.
6. Run `npm run check`.

## Done Means

The floor feels like an industrial belt where machines define movement and decisions.
