# AG110 Paritel Steam Bridge Status

Prompt: `AGENT_110_PARITEL_STEAM_BRIDGE`

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` section 16.6.
- Read `src/gen/maintenance/steam_valves.ts`.
- Read `src/gen/maintenance/water_bridge.ts`.
- Read `src/gen/maintenance/content_manifest.ts`.
- Read `src/render/hud_fx.ts`.
- Read `src/systems/events.ts`.

## Baseline Validation

- `npm run typecheck`: blocked before edits. `package.json` currently has only `dev`, `build`, and `preview`; npm reports `Missing script: "typecheck"`.

## Implementation Notes

- Added `src/gen/maintenance/paritel_steam_bridge.ts`.
- Registered the bridge in `src/gen/maintenance/content_manifest.ts`.
- Added narrow runtime hooks in `src/main.ts` for valve interaction and room-local steam/threat updates.
- Added a HUD `[E]` prompt hook in `src/render/hud.ts` for bridge valve targets.
- Added structured AG110 event ids in `src/core/types.ts` and readable log text in `src/systems/world_log.ts`.

## Gameplay Result

- Maintenance now stamps a Paritel steam bridge room with upper valve catwalk, central steam bridge, lower wet bypass, readable fog pockets, residue marks, lamps, and pipe walls.
- Three valve uses count pressure down from `3/3` to `0/3`; each state changes room-local fog/steam cells and emits `paritel_valve_changed`.
- A named Lampovy-based Paritel threat and a wet-route eel create combat/route pressure.
- Player options include closing valves, crossing under pressure, using the wet route, fighting, or luring the threat into active steam.
- Runtime publishes `paritel_bridge_crossed`, `paritel_threat_neutralized`, `paritel_steam_injury`, and `paritel_steam_avoided`.

## Final Validation

- `npm run typecheck`: blocked before edits; script missing from `package.json`.
- `npm run check`: blocked; script missing from `package.json`.
- `npm run smoke`: blocked; script missing from `package.json`.
- `npx tsc --noEmit --noUnusedLocals false --noUnusedParameters false --pretty false`: blocked by unrelated current worktree errors in `pneumomail_station.ts`, `main.ts` procedural anomaly/import variables, `map_ui.ts`, `faction_events.ts`, and `rpg.ts`. No diagnostics reference AG110 files.
- `npm run build`: blocked by unrelated current worktree error: `tryUseProceduralFloorAnomaly` is imported by `src/main.ts` but not exported by `src/systems/procedural_anomalies.ts`.
