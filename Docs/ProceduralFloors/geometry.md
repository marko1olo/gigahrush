# Procedural Floor Geometry Contract

This document is for agents adding new procedural floor geometry profiles.

## Current Entry Points

- Definitions: `src/data/procedural_floors.ts`
- Generator: `src/gen/procedural_floor.ts`
- Route/save state: `src/systems/procedural_floors.ts`
- Tests: `tests/procedural-floors.test.ts`

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

- `living_blocks`: residential rooms, kitchens, bathrooms, common rooms.
- `apartment_pressure`: dense residential/social pressure.
- `collectors`: industrial collectors, pipes, water.
- `workshops`: production halls and storage.
- `admin_pockets`: offices, documents, bureaucracy.
- `service_spines`: maintenance-side service shafts around `z=9..23`; corridor-heavy rooms are crossed by generation-time three-cell-wide service trunks from spawn to distant rooms, with lamps/screens/machines and service/power loot bias.

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

`service_spines` adds only bounded generation-time carving: at most `2 + floor(danger / 2)` service trunks are carved from the spawn room toward distant rooms. It does not add a runtime tick; later samosbor rebuilds regenerate the same trunks from the floor spec seed.

## Validation

Run at least:

```bash
npm run typecheck
npm run test:unit
```

For generator behavior or rendering changes, run:

```bash
npm run check
```
