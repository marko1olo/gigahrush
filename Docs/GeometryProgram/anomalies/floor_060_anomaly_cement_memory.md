# Procedural Anomaly: `cement_memory`

Type: existing `FloorAnomalyId`.

Goal: make no-backtracking pressure visible and bounded.

Geometry plan:

- Memory panels.
- Trail-scar route cues.
- Pressure corridors.

Runtime constraints:

- Fixed-size recent-cell ring.
- Aging once per second or slower.
- Panels clear local/recent pressure.

Validation:

- Never seals both lifts.
- Runtime state does not scan full world per frame.
