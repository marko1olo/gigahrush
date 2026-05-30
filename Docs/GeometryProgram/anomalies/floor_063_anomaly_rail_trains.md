# Procedural Anomaly: `rail_trains`

Type: existing `FloorAnomalyId`.

Goal: make train geometry readable, dangerous and mechanically clean.

Primary source:

- `src/systems/rail_trains.ts`

Geometry plan:

- Rail graph.
- Platforms.
- Lit safety shells.
- Crossings and transfer cues.

Runtime constraints:

- Preserve train/crush mechanics.
- Train-cell maps rebuild/clear on transitions.

Validation:

- Platform safety readable.
- Boarding/collision behavior survives floor rebuild.
