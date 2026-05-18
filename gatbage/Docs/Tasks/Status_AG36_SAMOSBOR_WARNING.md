# AG36 Samosbor Warning UX Status

Date: 2026-05-17

## Scope

Make samosbor read as a local blowout with a bounded pre-warning: siren/log/screen/NPC bark/map risk before the active phase, without changing shelter safety rules or adding another event bus.

## Checklist

- [x] Extracted `AGENT_36_SAMOSBOR_WARNING_UX` XML block.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P0.4, and required samosbor/HUD/map/event/screen files.
- [x] Created this status file.
- [x] Ran baseline `npm run typecheck`: passed.
- [x] Added bounded pre-warning state while `samosborTimer` is near zero.
- [x] Published one primary structured `samosbor_warning` event per warning window.
- [x] Added HUD warning, world-log text, and map risk marker for the warned zone.
- [x] Added cheap procedural screen flips and bounded NPC barks around the warned zone.
- [x] Preserved active samosbor start/end flow and aftermath flow.
- [x] Ran final `npm run check` attempt: blocked during compile/test compile by unrelated files.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG36_SAMOSBOR_WARNING.md`.

## Notes

- Warning window is 18 real seconds.
- The warned zone is the player's current non-samosbor zone, or nearest available zone. The active phase captures that same zone.
- The warning text includes countdown, zone, floor, variant, and the immediate action: get to a hermodoor or leave the zone.
- `npm run build` passed and `npm run smoke` passed (`hudLit=36864`, `webglLit=1024`).
- Final project-wide validation is currently blocked by unrelated compile errors in `src/systems/void_protocols.ts` and `tests/content-registry.test.ts`.
