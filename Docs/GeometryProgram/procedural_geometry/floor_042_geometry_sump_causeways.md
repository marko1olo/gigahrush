# Procedural Geometry: `sump_causeways`

Type: existing `FloorGeometryId`.

Goal: make flooded descent floors into percolation islands plus repairable causeways.

Geometry plan:

- Critical-ish wet/dry proxy.
- Largest component extraction.
- Explicit bridge/causeway repair points.
- Stash islands outside main path.

Gameplay decisions:

- Repair bridge.
- Cross contaminated route.
- Detour through dry causeway.
- Loot stash island.

Implementation constraints:

- Spawn/lifts must be in largest component or bridged.
- Do not save derived percolation map.

Validation:

- Forced spec with `geometryId: 'sump_causeways'`.
- Largest component includes route anchors.
