# FLOOR10_COMMUNAL_RING_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `communal_ring` geometry owner, z=-4.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/communal_ring.md`, `src/gen/design_floors/communal_ring.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/communal_ring.ts`, communal-ring helpers, `Docs/Tasks/Status_FLOOR10_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR10_GEOMETRY.md`.

Allowed with caution: isolated `communal_ring` full-floor call-out.

Forbidden: no Kvartiry population edits, no new social simulation loop.

## Geometry Goal

Make a residential communal loop: concentric corridors, shared bathrooms/kitchens as radial spokes, service core rooms, courtyards and bottlenecks where neighbors collide.

## Tasks

1. Build a ring-and-spoke macro layout with at least two concentric paths and several radial shared-service spokes.
2. Create visible shared-resource knots that invite trade, theft, hiding or conflict.
3. Add shortcuts through cramped rooms and service shafts, but avoid pure circular monotony.
4. Add motifs: communal kitchen, bathroom row, central service core, courtyard void, neighbor barricade.
5. Make exits attach to different ring sectors so route choice matters.
6. Run `npm run check`.

## Done Means

The floor feels like communal housing turned into a navigable machine: loops, shared facilities and social bottlenecks define the maze.
