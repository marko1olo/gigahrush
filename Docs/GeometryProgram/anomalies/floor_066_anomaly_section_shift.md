# Procedural Anomaly: `section_shift`

Type: existing `FloorAnomalyId`.

Goal: make moving section topology warned, bounded and dirty-flag safe.

Geometry plan:

- Bounded section rectangles.
- Warning corridors.
- Freeze/control room.

Runtime constraints:

- Shift after warning.
- Mutations invalidate caches and dirty versions.
- Freeze control has cooldown.

Validation:

- No crush without warning/fallback.
- Player cannot be shifted into hard softlock.
