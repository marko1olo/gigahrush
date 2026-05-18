# FLOOR01_ROOF_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `roof` geometry owner, z=-40, route id `roof`.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/roof.md`, `src/gen/design_floors/roof.ts`, `src/gen/design_floors/full_floor.ts`, `src/render/webgl.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/roof.ts`, roof-only helpers, `Docs/Tasks/Status_FLOOR01_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR01_GEOMETRY.md`.

Allowed with caution: one small roof-only branch/call in `src/gen/design_floors/full_floor.ts` if the local generator cannot own the final 1024x1024 topology.

Forbidden: no `FloorLevel.ROOF`, no new render special case beyond the existing dynamic ceiling hook, no lamps as the roof's lighting solution.

## Geometry Goal

Make the roof an open-air concrete archipelago, not a flat field. The ceiling is the sky and must provide even readable light across the whole roof. Lamp placement is not needed. The shape should be slabs, parapets, service bridges, antenna clusters, ventilation shelters, skylight holes, water tanks and long but interrupted sightlines.

## Tasks

1. Remove any remaining roof reliance on `Feature.LAMP`/`Feature.CANDLE`; use sky light or non-light features such as apparatus, machines, shelves and screens.
2. Build a macro layout of several roof islands connected by narrow service walks and at least two alternate routes from spawn to exit.
3. Add parapet/abyss edges, skylight pits and roof sheds so open space has navigational meaning.
4. Place one obvious antenna landmark, one shelter landmark and one sniper/long-sightline risk visible from early traversal.
5. Preserve dynamic sky provider behavior and keep sky texture update cost bounded.
6. Run `npm run check`; visually smoke the roof if render/light changes.

## Done Means

Spawn is bright without local lamps, the first 30 seconds show sky, landmark, shelter and risk, and every roof exit remains reachable without crossing an empty 1024x1024 plane.
