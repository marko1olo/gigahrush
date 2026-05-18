# AG108 Lift Arachna Log

2026-05-18

- Implemented a rare lift/shaft arachna encounter in `src/systems/lift_arachna.ts`.
- Hooked normal lift arrivals to roll only in lift-adjacent contexts; non-lift transitions clear active warning state.
- Added readable delayed cues: HUD warning panel, log/HUD messages, shaft shadow marks, and structured events.
- Added counterplay before damage: look up long enough, retreat from the shaft, leave by transition, or use loud/shotgun/fire-style action before the drop. Noise can force a bad/staggered drop.
- Spawn is capped to one named `Лифтовая арахна` using the existing `POLZUN` monster kind, with no transition damage and no repeated farming for the same route key.
- Added save/load normalization for encounter state and README documentation.

Validation:
- Baseline `npm run typecheck` failed before edits because the script is missing from `package.json`.
- `npx tsc --noEmit` is blocked by existing unrelated errors in the dirty tree.
- `npm run build` is blocked by existing duplicate exports in `src/systems/procedural_anomalies.ts`.
- `npm run check` is missing from `package.json`.
