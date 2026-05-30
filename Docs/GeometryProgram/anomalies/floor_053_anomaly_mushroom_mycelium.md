# Procedural Anomaly: `mushroom_mycelium`

Type: existing `FloorAnomalyId`.

Goal: make mycelium a visible territory field with food/spore decisions.

Geometry plan:

- Gray-Scott patches on proxy grid.
- Root corridors and food/spore basins.
- Contaminated containers and fungus monster anchors.

Runtime constraints:

- No unbounded growth.
- Growth is generation-time or local bounded event only.

Validation:

- Contaminated rooms reachable.
- Food reward has visible risk cue.
