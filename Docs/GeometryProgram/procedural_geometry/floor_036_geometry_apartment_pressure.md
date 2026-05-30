# Procedural Geometry: `apartment_pressure`

Type: existing `FloorGeometryId`.

Goal: make dense apartment pressure produce route decisions, not only many small rooms.

Geometry plan:

- Recursive-division social slabs.
- Braided queue loops.
- Potts domains for social pressure.

Gameplay decisions:

- Legal door.
- Crowd route.
- Lockpick/cut-through route.
- Barricade detour.

Implementation constraints:

- Keep residential density.
- Avoid one ordinary door isolating both lifts.
- No background refill.

Validation:

- Forced spec with `geometryId: 'apartment_pressure'`.
- Choke/articulation metric under threshold or explicitly tagged.
