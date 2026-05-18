# FLOOR11_LIVING_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `FloorLevel.LIVING` geometry owner, z=0 story hub.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/living.md`, `src/gen/living/index.ts`, `src/gen/living/side_quests.ts`, `src/gen/living/zone_content.ts`.

## Owned Write Scope

Owned: `src/gen/living/index.ts`, optional `src/gen/living/geometry.ts`, living-only helpers, `Docs/Tasks/Status_FLOOR11_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR11_GEOMETRY.md`.

Allowed with caution: living content registries only to preserve existing POI placement.

Forbidden: no tutorial removal, no hub overgrowth, no breaking `aptMask` protection.

## Geometry Goal

Make Living a readable survival hub: protected act hall/armory, apartment neighborhoods, market/service spokes, school/hospital/temple/library POIs, shelter paths and expedition exits.

## Tasks

1. Keep the start/tutorial rooms stable and protected while improving the surrounding neighborhood graph.
2. Add district structure: home blocks, service corridor, market strip, public POI cluster and shelter routes.
3. Make expedition prep geometry clear: supplies, exits and safe return paths should be discoverable from landmarks.
4. Add motifs: apartment block, public corridor, shelter cell, market strip, repair/service nook.
5. Verify volatile samosbor rebuild still preserves protected content and does not erase the new hub structure.
6. Run `npm run check`.

## Done Means

Living remains the easiest floor to understand, but now has distinct districts and routes instead of a generic start maze.
