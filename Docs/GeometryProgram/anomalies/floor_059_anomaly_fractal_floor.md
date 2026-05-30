# Procedural Anomaly: `fractal_floor`

Type: existing `FloorAnomalyId`.

Goal: make recursive geometry threatening but reachable.

Geometry plan:

- Recursive blocks, Cantor/Sierpinski gaps and self-similar loops.
- Largest component extraction.
- Bridges where route anchors fail.

Runtime constraints:

- Mostly generation-time.
- No protected-cell fractal deletion.

Validation:

- Path entropy sane.
- Spawn/lifts in largest component or bridged.

Implemented:

- `src/gen/procedural_anomalies/fractal_floor.ts` cuts a bounded recursive abyss/wall domain, carves self-similar bridge loops, extracts non-largest local islands and bridges route anchors back to the largest component.
- Protected cells, lift cells, door cells, containers, occupied actor cells and the spawn-safe radius are not deleted by the fractal pass.
- `tests/fractal-floor-anomaly.test.ts` forces `fractal_floor` and checks protected-cell safety, route lift reachability, bounded abyss count, reachable teleports and path entropy.
