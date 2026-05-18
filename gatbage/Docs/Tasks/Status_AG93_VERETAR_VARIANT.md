# AG93 Veretar Variant MVP Status

Date: 2026-05-18

## Scope

Implement the rare Veretar samosbor variant as a bounded white area leak with dry warning FX, area/sand marks, a route/shelter decision, aftermath, events, and debug forcing.

## Checklist

- [x] Extracted `AGENT_93_VERETAR_VARIANT_MVP` XML block.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` section 16.3, `veretar.md`, and required samosbor/HUD/mark/debug files.
- [x] Created this status file.
- [x] Ran baseline `npm run typecheck`: blocked because `package.json` has no `typecheck` script in this checkout.
- [x] Confirmed `veretar` variant, warning line, audio cue, aftermath beats, items and rumor tags were already present.
- [x] Added Veretar-specific HUD warning title/action and active HUD title.
- [x] Added dry white HUD veil and WebGL desaturation/overexposure path for active Veretar.
- [x] Biased `area_leak` source marks toward doors, screens, lift buttons and room-edge floor cells.
- [x] Added direct debug command to force Veretar and start the next samosbor.
- [x] Ran final validation.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG93_VERETAR_VARIANT.md`.

## Notes

- Area leaks remain bounded to 1-3 stamped sources.
- Door leak sources can briefly hold/open normal doors, which creates a short route and lets the player close the source through existing door interaction.
- `variant_veretar`, `area_leak`, and `white_sand` tags publish through existing samosbor and aftermath event paths.
- `npm run check` is unavailable in this checkout.
- `npx tsc --noEmit` is blocked by out-of-scope dirty-worktree errors in `src/gen/maintenance/pneumomail_station.ts` and `src/systems/govnyak.ts`.
- Filtered diagnostics for AG93-touched files are clean.
- `npm run build` passed.
