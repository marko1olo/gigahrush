# Procedural Floor Geometry Contract

This document is for agents adding new procedural floor geometry profiles.

## Current Entry Points

- Definitions: `src/data/procedural_floors.ts`
- Generator: `src/gen/procedural_floor.ts`
- Route/save state: `src/systems/procedural_floors.ts`
- Tests: `tests/procedural-floors.test.ts`
- Docs/source audit: `scripts/content-audit.mjs`

Do not add a new `FloorLevel` for an interstitial floor. Use a string `FloorGeometryId`.

## What A Geometry Profile Is

A geometry profile is data that says what kind of procedural floor should be built:

- `id`: lowercase snake case, stable.
- `title`: short Russian HUD/debug title.
- `baseFloor`: existing `FloorLevel` used for system mood, variants and economy.
- `weight`: relative chance.
- `roomCount`: approximate room budget.
- `dangerBias`: integer modifier before anomaly pressure.
- `minZ` / `maxZ`: optional vertical constraints.
- `wallTex` / `floorTex`: existing procedural texture ids.
- `roomTypes`: existing `RoomType` mix.
- `tags`: semantic hooks for loot, monsters, contracts and future rumors.

## Existing Profiles

Source count: 10 profiles in `FLOOR_GEOMETRIES`.

- `living_blocks` - tags: `residential`, `civil`; runtime/rebuild: base `FloorLevel.LIVING`, `minZ=-3`, `maxZ=7`, panel/lino apartment blocks with public corridor chords, a service cut, a shelter spur and route cue descriptors. It does not add a runtime tick.
- `apartment_pressure` - tags: `residential`, `crowd`, `riot`; runtime/rebuild: base `FloorLevel.KVARTIRY`, `minZ=-15`, `maxZ=3`, dense residential/social room mix. Active generator effects are recursive apartment slab corridors, Potts-style social domain naming, queue loops, locked legal/cut-through doors, barricade decoration and route cue descriptors for legal, crowd, cut-through and barricade detour choices. It does not add a runtime tick.
- `communal_knots` - tags: `residential`, `crowd`, `queue`, `canteen`, `civil`; runtime/rebuild: base `FloorLevel.KVARTIRY`, `minZ=-11`, `maxZ=11`, communal/common/kitchen/water-heavy room mix. Active generator effects are room mix, textures, tags, communal service-loop carving around kitchen/water/pantry/smoking/common rooms, through-flat bypass loops, Potts-style grievance room naming/marks, pantry/notice/through-flat containers and placement-field crowd weighting.
- `attic_weatherworks` - tags: `admin`, `roofline`, `antenna`, `wind`, `documents`; runtime/rebuild: base `FloorLevel.MINISTRY`, `minZ=-43`, `maxZ=-29`, pipe/concrete vent-camera rooms. Active generator effects are industrial room sizing/decor, textures, tags, vent-camera naming, tensor-guided roof-duct spines, crawl pocket rooms, exposed wind/signal lanes, repair/document cache containers and route cue descriptors. It does not add a runtime tick.
- `archive_warrens` - tags: `admin`, `documents`, `archive`, `paper_dust`, `maze`; runtime/rebuild: base `FloorLevel.MINISTRY`, `minZ=-31`, `maxZ=-13`, office/storage archive room mix. Active generator effects are room mix, textures, tags, archive/ledger naming, shelf/desk placement, floor texture retuning and paper-dust marks.
- `collectors` - tags: `industrial`, `water`, `pipes`; runtime/rebuild: base `FloorLevel.MAINTENANCE`, `minZ=1`, `maxZ=35`, pipe/concrete collectors; generator may convert sparse corridor cells to water through `applyWaterAndMachines()`.
- `workshops` - tags: `industrial`, `workshop`, `machines`; runtime/rebuild: base `FloorLevel.MAINTENANCE`, `minZ=5`, `maxZ=27`, metal/concrete production and storage rooms with no geometry-specific runtime tick.
- `service_spines` - tags: `industrial`, `service`, `transit`, `power`, `pressure`; runtime/rebuild: base `FloorLevel.MAINTENANCE`, `minZ=9`, `maxZ=23`; generator carves at most `2 + floor(danger / 2)` three-cell-wide service trunks from spawn toward distant rooms, with lamps/screens/machines and service/power loot bias. It does not add a runtime tick; later rebuilds regenerate trunks from the floor spec seed.
- `sump_causeways` - tags: `industrial`, `water`, `sump`, `blackwater`, `transit`, `abyss`; runtime/rebuild: base `FloorLevel.MAINTENANCE`, `minZ=21`, `maxZ=39`, high-danger flooded industrial route mix. Active generator effects are industrial room sizing/decor, textures, tags, black-water room naming and up to four causeway bands with edge decoration.
- `admin_pockets` - tags: `admin`, `documents`; runtime/rebuild: base `FloorLevel.MINISTRY`, `minZ=-43`, `maxZ=-13`, marble/parquet office and bureaucracy rooms with no geometry-specific runtime tick.

## Runtime And Rebuild Constraints

- `FloorGeometryId` values are save-bearing. `normalizeFloorRunState()` accepts only ids present in `FLOOR_GEOMETRIES`; renaming or removing an id invalidates saved specs unless normalization is intentionally updated.
- `makeProceduralFloorSpec()` filters profiles by `minZ`/`maxZ`, applies geometry danger bias before majority/anomaly selection, and derives loot/monster bias from geometry, majority and anomaly tags.
- Geometry generation runs before anomaly generation. If a geometry branch carves after room connection, it must preserve spawn safety, both lift directions, route connectivity and protected cells.
- Helper functions are not active content until `generateProceduralFloor()` calls them. Do not document helper-only behavior as shipped runtime.
- Geometry work is generation-time only. Runtime effects belong to systems or anomaly modules and should be rebuildable from the generated `World`.
- If a geometry branch changes cell, texture, fog, light, door or container state after the normal build pipeline, mark dirty flags and rebuild sparse maps where required.

## Adding A Profile

1. Add the id to `FloorGeometryId`.
2. Add a `FloorGeometryDef` to `FLOOR_GEOMETRIES`.
3. Reuse existing `RoomType`, `Tex`, item ids and monster tags first.
4. If the shape needs generator behavior, add a small branch in `src/gen/procedural_floor.ts` keyed by the geometry id.
5. Add or update a focused unit test if route/spec behavior changes.

## Rules

- No story NPCs, plot rooms or authored quest chains inside procedural geometry.
- The generated floor must have both up and down lifts unless route bounds make that impossible.
- Every generated room graph must stay connected from spawn.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist2`.
- No per-frame scans. Geometry work is generation-time only.
- Prefer tags over imports from another content module.

## Validation

For docs/source sync, run:

```bash
npm run content:audit
```

The audit compares the ids listed under `Existing Profiles` with `FLOOR_GEOMETRIES`.

For geometry implementation changes, also verify:

- The generated floor remains reachable from spawn to up/down lift after geometry work and after later anomaly topology changes.
- `ensureConnectivity()`, `sanitizeDoors()` or an equivalent local reachability pass still covers any new carving/closing behavior.
- New tags have matching loot/monster meaning or are deliberately future-facing.
- Geometry remains deterministic from `spec.seed` across floor transitions, save/load and samosbor rebuilds.

For generator behavior or rendering changes, run:

```bash
npm run check
```
