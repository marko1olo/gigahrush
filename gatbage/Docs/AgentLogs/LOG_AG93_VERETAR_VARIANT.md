# AG93 Veretar Variant MVP Log

Date: 2026-05-18

## Working Notes

- Baseline `npm run typecheck` could not run because this checkout's `package.json` only defines `dev`, `build`, and `preview`.
- Existing Veretar implementation already included the rare `veretar` variant, `НАСТУПИЛ ВЕРЕТАР`, dry audio cue, white sand/overexposed photo aftermath beats, item ids, rumor definitions, and basic area leak stamping.
- This pass tightened the MVP wiring around runtime readability, source placement, and debug forcing.

## Final Report

Implemented:

- Added Veretar-specific HUD prewarning title/action and active HUD title.
- Added a dry white HUD veil in `hud_fx.ts` and a Veretar desaturation/overexposure branch in the WebGL blit pass.
- Updated minimap warning labels so Veretar appears as `ВЕР` instead of generic `СБОР`.
- Changed area leak source selection to prefer doors, procedural screens, lift buttons and room-edge floor cells, while preserving the 1-3 source cap.
- Door leak sources can briefly hold/open normal doors, giving a short route and a natural close/seal decision through existing door interaction.
- Added a direct debug command: `ВЕРЕТАР: force + самосбор`.

Validation:

- Baseline `npm run typecheck`: blocked, missing script.
- `npm run check`: blocked, missing script.
- `npx tsc --noEmit`: blocked by unrelated dirty-worktree errors in `src/gen/maintenance/pneumomail_station.ts` and `src/systems/govnyak.ts`.
- Filtered AG93 diagnostics: no remaining errors in `src/render/hud_fx.ts`, `src/render/hud.ts`, `src/render/map_ui.ts`, `src/render/webgl.ts`, `src/systems/samosbor.ts`, or `src/systems/debug.ts`.
- `npm run build`: passed.
