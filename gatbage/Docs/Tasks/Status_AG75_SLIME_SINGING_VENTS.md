# Status_AG75_SLIME_SINGING_VENTS

## Preflight

- [x] Extracted `AGENT_75_SLIME_SINGING_VENTS` prompt block.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` section 16.1.
- [x] Read `src/systems/audio.ts`.
- [x] Read `src/render/hud_fx.ts`.
- [x] Read `src/gen/maintenance/content_manifest.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Read `src/systems/debug.ts`.
- [x] Created this status file.

## Baseline Validation

- `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.
- `npx tsc --noEmit`: passed before edits.

## Implementation Plan

- [x] Add one Maintenance slime-singing vent/sample route marker.
- [x] Add bounded procedural route cue audio/HUD behavior without a new audio loop.
- [x] Publish hear/follow/ignore events through `systems/events.ts`.
- [x] Add debug trigger for smoke testing the cue.
- [x] Run final validation and append report to `Docs/AgentLogs/LOG_AG75_SLIME_SINGING_VENTS.md`.

## Implementation Notes

- Added `src/gen/maintenance/slime_singing_vents.ts`.
- Added `src/systems/route_cues.ts` as a bounded generated-marker cue hook.
- Added `playRouteCueTone()` in `src/systems/audio.ts`.
- Added route cue HUD waveform/panel drawing through `src/render/hud_fx.ts` and `src/render/hud.ts`.
- Added debug command `Route cue: trigger nearest`.
- Incidental validation unblockers: merged duplicate procedural anomaly exports, added the missing procedural anomaly HUD target export, fixed one pneumomail `world.stamp()` argument count, and removed one unused `govnyak` helper.

## Final Validation

- `npm run typecheck`: unavailable; `package.json` has no `typecheck` script.
- `npx tsc --noEmit`: passed after fixes.
- `npm run build`: passed.
- `npm run check`: unavailable; `package.json` has no `check` script.
- `npm run smoke`: unavailable; `package.json` has no `smoke` script.
- Visual/audio smoke: not run in a browser; debug trigger exists for in-game verification.
