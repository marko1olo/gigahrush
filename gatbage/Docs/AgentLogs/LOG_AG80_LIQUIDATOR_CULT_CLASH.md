# AG80 Liquidator Cult Clash Log

## 2026-05-18T01:22:14Z

- Implemented bounded `cult_liquidator_clash` behavior on top of the existing faction event id.
- Added two data-driven sides: 2 liquidators versus 2-3 cultists, with side-specific weapons and inventories.
- Added active clash tracking with one-shot floor/zone anti-farm key, active clash cap, start/intervention/aftermath event publication, bounded loot drops, outcome evidence notes, local pressure, and rumor ids.
- Added player hooks for helping either side through damage/kills, looting event drops during the fight, avoiding by leaving the scene, and reporting aftermath to a liquidator.
- Added direct debug force command: `Форсировать стычку ликвидаторов и культа`.
- Baseline `npm run typecheck`: blocked because the script is missing from `package.json`.
- Requested `npm run check`: blocked because the script is missing from `package.json`.
- Validation `npx tsc --noEmit --pretty false`: passed.
- Validation `npm run build`: passed.
