# Candidate Floor Or Anomaly: `sandpile_perekrytie`

Priority: required first-wave candidate.

Recommended form: procedural anomaly first, or authored route floor with one bounded collapsing arena.

Base floor: `FloorLevel.MAINTENANCE`.

Fantasy: critical instability slab where the player can trigger controlled collapse.

Algorithm stack:

- Abelian sandpile on coarse proxy cells
- topple thresholds
- unstable wall/floor tags
- bounded local collapse triggers

Implementation files, choose one path:

- design floor: `src/gen/design_floors/sandpile_perekrytie.ts`
- anomaly: `src/gen/procedural_anomalies/sandpile_perekrytie.ts`
- runtime anomaly if needed: `src/systems/procedural_anomalies/sandpile_perekrytie.ts`

Required structures:

- unstable slab arena
- safe rim route
- optional collapse shortcut
- stabilizer/control point
- visible cracks and warnings

Gameplay decisions:

- trigger collapse to open shortcut
- avoid closing retreat
- lure monsters into falling slab
- stabilize shelter/bridge

Validation:

- collapse cannot delete lift access
- dirty versions update after runtime mutation
- no trap without warning/fallback
- save behavior explicit
