# Shared Contract: Runtime Topology Mutation

Purpose: keep moving walls, collapses, cellular arenas, trains and living tunnels safe.

Every runtime topology feature must state:

- cadence
- max arena/cell count
- cache key
- invalidation condition
- dirty flags touched
- route-critical protections
- counterplay
- save behavior

Dirty/version rules:

- cell solidity changes call `markCellsDirty()`.
- wall texture changes call `markWallTexDirty()`.
- floor texture changes call `markFloorTexDirty()`.
- feature changes use `setFeatureAt()` or call `markFeaturesDirty()`.
- fog changes call `markFogDirty()`.
- container map changes rebuild `containerMap`.
- door edits use helpers or are followed by sanitation.

Forbidden:

- renderer-owned gameplay state
- full-world mutation per frame
- hidden instant death
- route anchor deletion

Validation:

- mutation changes expected versions
- caches rebuild after transition/load
- spawn/lifts/controls remain reachable
