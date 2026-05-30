# Procedural Anomaly: `smog`

Type: existing `FloorAnomalyId`.

Goal: improve visibility geometry with curl-smog plumes and filter pockets.

Primary source:

- `src/gen/procedural_floor.ts`
- `src/systems/procedural_anomalies.ts`

Geometry plan:

- Generate tileable scalar potential on proxy grid.
- Stamp bounded fog cells with decay.
- Place source apparatus and filter/counterplay pockets.

Runtime constraints:

- No full-world advection during play.
- Fog mutation must mark fog dirty.

Validation:

- Route remains reachable with low visibility.
- Counterplay item/control reachable.
