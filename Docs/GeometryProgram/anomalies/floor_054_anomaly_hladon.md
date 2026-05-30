# Procedural Anomaly: `hladon`

Type: existing `FloorAnomalyId`.

Goal: improve cold geometry with readable cold shells and heat counterplay.

Primary source:

- `src/systems/hladon.ts`

Geometry plan:

- BFS/SDF cold shells around cold rooms.
- Warm counterplay rooms outside deepest shell.
- Frost/fog cues on transition boundary.

Runtime constraints:

- Runtime masks rebuild from current world/room names.
- Cache invalidates after rebuild/mutation.

Validation:

- Warm shelter reachable.
- Cold shell cannot block both lift directions.
