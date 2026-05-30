# Procedural Geometry: `workshops`

Type: existing `FloorGeometryId`.

Goal: make workshop floors read as production cells, docks and repair lines.

Geometry plan:

- Factory cell chains.
- Dock loop grammar.
- Tool-room chords.
- Decision-triangle placement for repair/sabotage/escape.

Gameplay decisions:

- Work.
- Repair.
- Sabotage.
- Steal output.

Implementation constraints:

- No live factory sim.
- Use existing containers, machines, factory ids and events.

Validation:

- Forced spec with `geometryId: 'workshops'`.
- At least one loop and one tool-room chord.
