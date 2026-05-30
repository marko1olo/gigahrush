# Procedural Geometry: `living_blocks`

Type: existing `FloorGeometryId`.

Primary source:

- `src/data/procedural_floors.ts`
- `src/gen/procedural_floor.ts`
- `Docs/ProceduralFloors/geometry.md`

Goal: make ordinary residential procedural floors spatially distinct from generic rectangle packing.

Geometry plan:

- Add BSP or Poisson apartment blocks with service chords.
- Preserve living/kitchen/bathroom/storage/common room mix.
- Add public route, service route and shelter spur descriptors.

Gameplay decisions:

- Home route.
- Public route.
- Service cut.
- Shelter spur.

Implementation constraints:

- Do not touch `FloorLevel`.
- Do not save derived block graph.
- Use weighted routing through mutable cells only.

Validation:

- Forced spec with `geometryId: 'living_blocks'`, `anomalyId: 'none'`.
- Spawn and both lift directions reachable.
- No protected/lift cells overwritten.
