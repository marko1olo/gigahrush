# AG36 Samosbor Warning UX Log

Date: 2026-05-17

## Final Report

Implemented:

- Added an 18-second pre-warning window in `src/systems/samosbor.ts`.
- The warning chooses the local risk zone before impact and the active samosbor captures that same zone.
- Published one primary structured `samosbor_warning` event per warning window with floor, variant, zone, countdown and action text.
- Moved the siren to the warning window instead of the active start.
- Added bounded NPC warning barks and local procedural screen flips through existing samosbor/event paths.
- Added compact HUD warning display and a map risk marker without covering the bottom status bar.
- Updated world-log formatting so warning events show the actionable warning text instead of a generic line.

Validation:

- Baseline `npm run typecheck`: passed before edits.
- Filtered post-edit typecheck: no diagnostics in AG36 touched files.
- `npm run build`: passed.
- `npm run smoke`: passed (`hudLit=36864`, `webglLit=1024`).
- `npm run check`: blocked during compile/test compile by unrelated current errors in `src/systems/void_protocols.ts` and `tests/content-registry.test.ts`.
- Headless debug-trigger capture was attempted; the built game launched and debug overlay could be opened, but the scripted key path was not reliable enough to use as final validation.

Blocked:

- `npm run check` cannot be completed until the unrelated compile/test errors are resolved.
