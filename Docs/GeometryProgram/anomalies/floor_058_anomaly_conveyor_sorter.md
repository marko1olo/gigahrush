# Procedural Anomaly: `conveyor_sorter`

Type: existing `FloorAnomalyId`.

Goal: make conveyor loops into route and item-sorting decisions.

Geometry plan:

- Item lanes.
- Sorting loops.
- Industrial side belts.
- Control/receiver rooms.

Runtime constraints:

- Movement stays local/cadence-bound.
- No live factory simulation.

Validation:

- Route anchors cannot be pushed into blocked cells.
- Shutdown/control path reachable.
