# Procedural Geometry: `collectors`

Type: existing `FloorGeometryId`.

Goal: make collector floors use drainage basin geometry, not only pipe room tags.

Geometry plan:

- Coarse height/flow proxy.
- Wet basins and dry causeways.
- Valve rooms at basin saddles.

Gameplay decisions:

- Wet shortcut.
- Dry long path.
- Valve reroute.
- Tool repair crossing.

Implementation constraints:

- Water/blackwater cannot seal both lifts.
- Runtime pressure effects must be bounded if added.

Validation:

- Forced spec with `geometryId: 'collectors'`.
- Dry route and wet route metrics recorded.
