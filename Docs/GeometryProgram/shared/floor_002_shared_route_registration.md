# Shared Contract: Route And Profile Registration

Purpose: prevent dead route/profile/anomaly data.

Design floor route:

1. Add generator first: `src/gen/design_floors/<id>.ts`.
2. Add route data in `src/data/design_floors.ts`.
3. Register generator in `src/gen/design_floors/manifest.ts`.
4. Add population profile or explicitly document no broad ordinary NPC field.
5. Add forced-generation test or debug path.

Procedural geometry:

1. Add `FloorGeometryId` union member.
2. Add `FLOOR_GEOMETRIES` def.
3. Add generator branch/module.
4. Add loot/monster tags only when meaningful.
5. Add forced-spec test with `anomalyId: 'none'`.

Procedural anomaly:

1. Add `FloorAnomalyId` union member.
2. Add `FLOOR_ANOMALIES` def.
3. Add generator module/branch.
4. Add runtime hook only if needed.
5. Add stress test if topology mutates.

Never:

- add id-only data
- rename save-bearing ids casually
- add route stop as new `FloorLevel`
