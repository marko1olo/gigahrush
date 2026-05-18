# LOG_AG75_SLIME_SINGING_VENTS

## 2026-05-18

- Implemented a Maintenance slime-singing vent/sample cue.
- Added `src/gen/maintenance/slime_singing_vents.ts`: a small vent mouth, slime residue, sample alcove, public sample jar with `strange_clot`, and nearby danger.
- Added bounded route cue runtime in `src/systems/route_cues.ts`: generated marker lookup only, slow scan cadence, audio cooldown, HUD cue, and hear/follow/ignore event publication through `rumor_observed`.
- Added procedural non-looping pipe-song audio via `playRouteCueTone()` in `src/systems/audio.ts`.
- Added HUD waveform/panel drawing and `[E]` prompt integration.
- Added debug command `Route cue: trigger nearest`.
- Validation: `npx tsc --noEmit` passed; `npm run build` passed.
- Missing scripts: `npm run typecheck`, `npm run check`, and `npm run smoke` are not defined in `package.json`.
- Visual/audio browser smoke was not run; the debug command can force the cue without waiting for proximity or cooldown.
