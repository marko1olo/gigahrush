# AG92 Maronary Wrong Door Status

Date: 2026-05-18

Preflight:
- Prompt block `AGENT_92_MARONARY_WRONG_DOOR_SHORTCUT` read from `Docs/AgentPrompts/AGENT_92_MARONARY_WRONG_DOOR_SHORTCUT.md`.
- Read `README.md`, `architecture.md`, `maronary.md`, `desdoc.md` section 16.3, and the requested runtime/render files.
- Baseline `npm run typecheck`: blocked; `package.json` has no `typecheck` script.

Implementation:
- Added `src/systems/wrong_door.ts` for one active sparse Maronary wrong-door remap per world, with route selection, one-shot use, expiry, cooldown, and map cue state.
- Wired Maronary start to create one remap, preferring the warning door cue when available.
- Player movement consumes the wrong-door remap before generic anomaly teleports and then deletes it.
- Debug command added: `МАРОНАРИЙ: wrong door`.
- Minimap/full map now draw a green wrong-door route cue while the remap is live.
- World log text now distinguishes wrong-door created, used, and expired phases.
- Added focused pure route-helper coverage in `tests/wrong-door.test.ts`.

Validation:
- `npx tsc -p tsconfig.json`: failed on unrelated checkout errors in several in-progress modules (`main.ts`, `faction_events.ts`, `contracts.ts`, `procedural_anomalies.ts`, etc.).
- `npm run check`: blocked; `package.json` has no `check` script.
- `npm run build`: blocked by duplicate exports in `src/systems/procedural_anomalies.ts`, outside AG92.
