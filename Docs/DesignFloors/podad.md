# Design Floor: Подад

Status: implemented authored route floor. Route id: `podad`. Anchor: `z=-40`. Base floor: `HELL`. Shipped HUD name: `Подад`.

Owned file: `src/gen/design_floors/podad.ts`. Route registration lives in `src/data/design_floors.ts`, and generator registration lives in `src/gen/design_floors/manifest.ts`.

## Role

Podad is the moving lower Hell floor after the foothold quest: Hell-like meat geometry with unstable topology. It contains Nikanor, Marfa and the three Heralds. Until the Heralds are dead, lower lift routing from Podad is blocked.

Primary decisions: push deeper, fight Heralds, use moving tunnels as risk/reward routes, retreat upward, or keep descending after the lower route opens.

## Generation

- Builds a full route floor with organic Hell field, carved spines and named POI rooms.
- Places upper lifts by default, but no lower lifts until the Herald gate is opened.
- Tags three rooms with existing topology anomaly markers: living tunnels, wall snake and section shift.
- Uses the generic dynamic topology systems; no Podad-only frame loop is required.

## Story Hooks

- Major Gromny sends the player here after the Hell holdout and liquidator foothold.
- Nikanor points the player to Marfa.
- Marfa's Herald quest unlocks the lower route and the "НИЖЕ И НИЖЕ" descent to `z=-50`.

## DoD

- Player can reach the floor by normal route after Hell.
- Heralds are present and killable.
- Lower lifts appear only after the Herald gate opens.
- Dynamic wall/tunnel behavior comes from reusable anomaly systems.
