# Procedural Anomaly: `mirror_run`

Type: existing `FloorAnomalyId`.

Goal: make mirrored geometry learnable through visible tells.

Geometry plan:

- Paired mirrored rooms.
- Mirrored labels/lights/items.
- Optional sparse paired shortcuts.

Runtime constraints:

- Avoid hidden coordinate tricks.
- Teleport-like links, if used, are sparse and bidirectional.

Validation:

- Route works without understanding mirror trick.
- Mirror cues are visible.
