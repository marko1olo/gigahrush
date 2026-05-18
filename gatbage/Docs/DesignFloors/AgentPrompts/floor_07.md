# FLOOR07_REGISTRY_MORGUE_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `registry_morgue` geometry owner, z=-16.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/registry_morgue.md`, `src/gen/design_floors/registry_morgue.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/registry_morgue.ts`, morgue-only helpers, `Docs/Tasks/Status_FLOOR07_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR07_GEOMETRY.md`.

Allowed with caution: isolated `registry_morgue` call-out if current full-floor expansion must invoke local geometry.

Forbidden: no save/death system rewrite, no new global corpse engine.

## Geometry Goal

Make a bureaucratic morgue where identity and death are architecture: cold drawer grids, body conveyors, tag desks, autopsy bays, legal counters and freezer loops.

## Tasks

1. Generate drawer-wall corridors and cold rooms as repeated geometry, not just room names.
2. Add a conveyor or tag-route spine that connects morgue areas and creates visible navigation.
3. Include loops and one-way-feeling detours around freezer blocks, with safe bypasses.
4. Add motifs: drawer canyon, autopsy bay, registry desk, body conveyor, frost vault.
5. Ensure corpse/identity content remains reachable and cannot block the lift path.
6. Run `npm run check`.

## Done Means

The floor feels like a death registry maze with cold procedural structure and readable bypass routes.
