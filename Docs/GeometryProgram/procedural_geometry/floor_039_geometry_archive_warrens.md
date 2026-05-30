# Procedural Geometry: `archive_warrens`

Type: existing `FloorGeometryId`.

Goal: make archive floors true fair mazes with document landmarks.

Geometry plan:

- Wilson, Prim or Growing Tree on coarse grid.
- Braiding post-pass.
- Landmark offices by depth and centrality.
- Optional locked document chords.

Gameplay decisions:

- Follow fair maze.
- Use clerk shortcut.
- Open locked document vault.
- Risk dead-end reward.

Implementation constraints:

- Route backbone to lifts remains ungated.
- Keys, if used, sit on accessible predecessor side.

Validation:

- Forced spec with `geometryId: 'archive_warrens'`.
- Landmark count and path entropy recorded.
