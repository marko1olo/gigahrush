# LOG AG48 Water Riot

## Final Report

- Added Kvartiry water-distribution riot POI in `src/gen/kvartiry/water_riot.ts`.
- Registered it in `src/gen/kvartiry/content_manifest.ts`.
- Added bounded cast: queue resident lead, one liquidator authority, one wild rival, and three ambient residents.
- Added water/coupon drops, public water barrel, and owner-access liquidator supply box for theft-risk stealing.
- Added side quests for queue residents, liquidator accounting, and wild raider coupon theft.
- Added contracts `kv_water_riot_delivery`, `kv_water_riot_defense`, and `kv_water_coupon_heist`.
- Added rumors for the standpipe crisis, liquidator defense work, and coupon theft.

## Validation

- Baseline `npm run build`: passed.
- Post-change `npm run build`: passed.
- Post-change `npm run smoke`: passed.
- `npm run check`: failed during typecheck on unrelated `src/systems/void_protocols.ts` errors outside AG48 scope.
- Separate `npm run test:unit`: blocked during TypeScript compile by unrelated workspace errors.

## Polish Check

- At least two player choices: queue delivery, liquidator support, wild coupon theft, and direct supply theft.
- Walk-away path exists: no forced combat trigger or blocking crowd simulation was added.
