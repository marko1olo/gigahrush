# Procedural Anomaly: `conway_life`

Type: existing `FloorAnomalyId`.

Goal: keep cellular topology local and legible.

Geometry plan:

- 1-3 arenas.
- Seeded live/dead masks.
- Reset/freeze controls.

Runtime constraints:

- Arena size 12x12 to 48x48.
- Typed masks.
- Fixed cadence.
- Protect lifts, doors, containers and player-adjacent cells.

Validation:

- Arena does not eat route anchors.
- Runtime mutation dirty flags correct.
