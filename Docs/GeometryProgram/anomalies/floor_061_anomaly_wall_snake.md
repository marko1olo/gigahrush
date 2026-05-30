# Procedural Anomaly: `wall_snake`

Type: existing `FloorAnomalyId`.

Goal: make moving wall predator corridor route-safe and counterplay-readable.

Geometry plan:

- One bounded snake perimeter path.
- Bait/control room.
- Crush warning lanes.

Runtime constraints:

- Tail restores cell snapshots.
- Mutations mark dirty versions.
- Protected cells and lift access are forbidden.

Validation:

- Bait/control affects snake.
- No protected cell consumed.
