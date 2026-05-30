# Procedural Anomaly: `radio_chess`

Type: existing `FloorAnomalyId`.

Goal: strengthen local timing arenas without whole-floor ticking.

Geometry plan:

- Checker/timing rooms.
- Beacons and radio controls.
- Safe/unsafe phase cues.

Runtime constraints:

- Arena buffers are local typed arrays.
- Fixed cadence.
- Reset/freeze controls bounded.

Validation:

- No whole-floor tick.
- Player has visible phase counterplay.
