# FLOOR15_SERVICE_FLOOR_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `service_floor` geometry owner, z=16.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/service_floor.md`, `src/gen/design_floors/service_floor.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/service_floor.ts`, service-floor helpers, `Docs/Tasks/Status_FLOOR15_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR15_GEOMETRY.md`.

Allowed with caution: isolated `service_floor` call-out.

Forbidden: no global lift route rewrite, no save/load edits, no one-floor logic in `main.ts`.

## Geometry Goal

Make a staff-only lift/service machine maze: elevator machinery, cable trays, duct bypasses, locked control rooms, staff corridors, pump rooms and maintenance overlooks.

## Tasks

1. Build a macro layout around several lift-machine cores connected by staff corridors and duct shortcuts.
2. Use locked/service geometry to make repair, reroute, steal and flee choices physical.
3. Add vertical fantasy through shafts, overlooks and cable corridors while staying in 2D cells.
4. Add motifs: lift motor room, cable trench, staff corridor, control booth, duct bypass, pump alcove.
5. Preserve normal route exits and make them visually distinct from service shortcuts.
6. Run `npm run check`.

## Done Means

The floor is clearly the machine layer behind the lifts, with staff geometry and bypasses shaping play.
