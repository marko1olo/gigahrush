# Procedural Anomaly: `samosbor_seed`

Type: existing `FloorAnomalyId`.

Goal: make samosbor infection geometry readable and route-safe.

Geometry plan:

- Meat/slime breach.
- Protected-shell contrast.
- Fog and gut floor marks.
- Retreat/shelter cues.

Runtime constraints:

- Preserve existing route timer semantics.
- Do not erase `aptMask`, hermetic walls, lift buttons or route anchors.

Validation:

- Route remains reachable after anomaly generation.
- Samosbor pressure visible before it becomes unavoidable.
