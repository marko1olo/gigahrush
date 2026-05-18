# LOG FLOOR08 KVARTIRY

## Final Report

- Added Kvartiry route-conflict POI `Маршрутный сход Три Двери` in `src/gen/kvartiry/kv08_route_assembly.ts`.
- Registered the module through `src/gen/kvartiry/content_manifest.ts`.
- Added three side-quest outcomes:
  - `kv08_open_manhattan_crossroads`: support liquidator route cutting toward Manhattan Crossroads.
  - `kv08_hold_communal_ring`: support citizen safe-chain routing toward Communal Ring.
  - `kv08_sell_market_88_lane`: support Market 88 route brokerage.
- Added fixed active cast: 3 quest NPCs and 3 ambient pressure/witness NPCs.
- Added three route-tagged containers with owner/theft consequences.
- Added an observer that converts completion of any of the three outcome quests into an explicit public `kv08_route_outcome` world event through `publishEvent()`.
- No population cap, global crowd simulation, `main.ts`, core enum, or Kvartiry population logic changed.

## Validation

- Baseline `npm run build`: passed.
- Post-change `npm run check`: passed.

## Polish Check

- Active NPCs created by this module: 6 total.
- Count is fixed and does not scale with room count or world size.
- Walk-away path exists: the POI is passable and all route consequences are opt-in through quest completion or container interaction.
