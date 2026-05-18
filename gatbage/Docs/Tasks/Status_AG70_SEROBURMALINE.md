# AG70 Seroburmaline Status

## Preflight

- Prompt XML block extracted: `AGENT_70_SEROBURMALINE_NO_LOOK`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.1.
- Read required files: `src/render/hud_fx.ts`, `src/render/marks.ts`, `src/render/map_ui.ts`, `src/systems/psi.ts`, `src/systems/events.ts`.
- Read existing POI module: `src/gen/maintenance/concentrate_press.ts`.
- Baseline `npm run typecheck`: blocked, `package.json` has no `typecheck` script.

## Implementation

- [x] Add seroburmaline maintenance POI with one or two marked sources.
- [x] Add bounded direct-look exposure and safe avoidance behavior.
- [x] Add readable HUD/minimap feedback without input lock or blanking.
- [x] Add source covering/removal through existing items/tools and publish tagged events.
- [x] Run final validation.
- [x] Append final report to `Docs/AgentLogs/LOG_AG70_SEROBURMALINE.md`.

## Notes

- Event type ids are a closed core union in this checkout, so AG70 uses existing event types with `slime`, `seroburmaline`, `exposure`, `avoided`, and `covered` tags.

## Validation

- `npm run typecheck`: blocked, missing script in `package.json`.
- `npx tsc --noEmit`: failed on existing unrelated dirty-tree errors; filtered output has no `seroburmaline` or `seroburmaline_no_look` errors.
- `npm run build`: blocked before AG70 by duplicate exports in `src/systems/procedural_anomalies.ts`.
- `npm run check`: blocked, missing script in `package.json`.
- `git diff --check` on AG70-touched paths: passed.
