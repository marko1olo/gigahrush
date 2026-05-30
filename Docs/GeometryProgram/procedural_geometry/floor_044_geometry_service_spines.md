# Procedural Geometry: `service_spines`

Type: existing `FloorGeometryId`.

Goal: upgrade service trunks into tensor spine geometry with bounded side chambers.

Geometry plan:

- 128/256 proxy tensor field.
- Long service spines.
- Side chambers at high-betweenness nodes.
- Panel/control placement near junctions.

Gameplay decisions:

- Fast exposed trunk.
- Slow utility bypass.
- Panel reroute.
- Power/pressure repair.

Implementation constraints:

- No `main.ts` lift logic.
- Runtime panel effects dirty-flag local edits only.

Validation:

- Forced spec with `geometryId: 'service_spines'`.
- Spine count, loop count and lift path length recorded.
