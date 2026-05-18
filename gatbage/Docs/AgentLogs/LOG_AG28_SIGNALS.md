# AG28 Procedural Signals / Screens Log

## 2026-05-17

What was wrong:
- Procedural screens existed as rare animated wall decoration, but their variants were generic and did not consistently imply actionable world state.
- `world.screenCells` gave a bounded animation list, but there was no category summary for screen/debug inspection.

What was done:
- Added `src/data/screen_signals.ts` with seven screen signal definitions tied to existing event types and rumor ids.
- Reworked procedural screen texture variants into compact symbolic signals: samosbor warning, ration/water shortage, faction map, lift anomaly, ministry queue board, maintenance pressure gauges, and VOID protocol.
- Changed placement to choose signal categories at generation time from floor, room type, zone faction, and nearby-lift bias.
- Kept animation bounded to `world.screenCells`; no all-world screen scan was added.
- Added `summarizeProceduralScreens(world)` for screen count/category debug summaries without touching the debug overlay.
- Updated `README.md` with factual shipped behavior.

Cinematic Cheats used:
- Texture variant doubles as the screen-cell category tag.
- Signals imply events and rumors through existing ids, but decorative screens do not publish gameplay facts.
- Raycaster-scale frames use symbols, blocks, arrows, bars, and short labels instead of long text.

Verification:
- Baseline `npm run build` passed before AG28 edits.
- Final `npm run build` passed after AG28 edits.
- `npm run typecheck` currently fails in unrelated existing files after AG28 errors were fixed: `src/main.ts` and `src/systems/containers.ts`.
- `npm run smoke` currently fails before visual validation on unrelated runtime error `applyRumorEventToNpc is not defined`, followed by blank-canvas detection.
