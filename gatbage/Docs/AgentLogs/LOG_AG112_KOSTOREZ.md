# LOG_AG112_KOSTOREZ

## Final Report

- Implemented Kostorez as a new melee elite monster kind rather than a variant because the feature needs stateful readable windup and interruption.
- Added close-burst behavior with clear pre-hit cue: growl/log warning, raised sprite scale pose, 1.35s windup, and delayed damage only if the target remains close with line of sight.
- Added counterplay: distance breaks the burst, obstacles/columns cancel the strike, shotgun pellets stagger and interrupt windup, and `metal_sheet` absorbs part of one cut.
- Added structured events for sighting, shotgun windup interrupt, armor cut/hit, and escape from windup. Existing `player_kill_monster` events cover kills and now carry Kostorez ecology metadata.
- Added four rumors/leads and a bounded Maintenance encounter room, `Разрезочная бронелистов`, with visual cut marks, cover, shells, a metal sheet, and one Kostorez.
- Validation: `npx tsc --noEmit` passed; `npm run build` passed. `npm run typecheck`, `npm run smoke`, and `npm run check` are blocked because the current `package.json` does not define those scripts.
