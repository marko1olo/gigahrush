# Status_FLOOR21_GEOMETRY

Agent: FLOOR21_GEOMETRY
Domain: Design floor / Darkness route geometry
Prompt source: `gatbage/Docs/DesignFloors/AgentPrompts/floor_21.md`

## Preflight Record

- Read `README.md`, `architecture.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/darkness.md`, `src/gen/design_floors/darkness.ts`, and `src/gen/design_floors/full_floor.ts`.
- Followed current README path policy by recording this status under `gatbage/Docs/Tasks/` instead of recreating root `Docs/Tasks/`.

## Implementation

- [x] Expanded Darkness from a 7-room pocket to an 11-room macro graph.
- [x] Added generator/control rooms, a shadow toll gate, and an emergency fallback pocket.
- [x] Added route geometry for three choices: lit name/control route, short hostile toll route, and longer dark fallback route.
- [x] Added repeated motifs: light islands, dead lamp rows, generator room, shadow toll gate, black corridors, and emergency stash.
- [x] Replaced the old random full-floor Darkness scatter with a local Darkness route expansion call-out.
- [x] Kept the route reachable without any mandatory rare item.

## Geometry Notes

Darkness now plays as a compact post-Void route graph inside the full torus instead of random void blobs. Spawn opens into a lit threshold and a nearby junction; from there the player can spend light on a safer generator/name/control route, push through a short shadow toll chokepoint, or take a longer black-corridor fallback with emergency pockets. The exit trace remains reachable by all routes.

Approximate generated counts from the targeted Darkness check: 11 rooms, 18 entities, 2 adjacent reachable lift cells, 2951 floor cells, 705 near-unlit floor cells, and 576 high-fog floor cells.

## Validation

- `npm run check`: passed.
- `npm run smoke`: first run failed in Chrome after title/start with missing canvas diagnostics; rerun passed at `http://127.0.0.1:49987/?smoke=1`.
- Targeted Darkness generation/readability check: passed; both lift cells are adjacent to reachable walkable cells.
