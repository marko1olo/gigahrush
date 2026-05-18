# Status AG48 Water Riot

## Scope

- Prompt: `AGENT_48_KVARTIRY_WATER_RIOT`
- Domain: Kvartiry POI / social pressure / water scarcity.
- Owned files: new Kvartiry content module, Kvartiry content manifest, contracts, rumors, optional water resource tuning.

## Preflight

- Extracted prompt block `AGENT_48_KVARTIRY_WATER_RIOT`.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` P1/P2.
- Read Kvartiry content hooks and nearby modules:
  - `src/gen/kvartiry/content_manifest.ts`
  - `src/gen/kvartiry/social_helpers.ts`
  - `src/gen/kvartiry/social_pressure.ts`
  - `src/gen/kvartiry/ration_queue.ts`
- Read relevant data/systems:
  - `src/data/resources.ts`
  - `src/data/contracts.ts`
  - `src/data/rumors.ts`
  - `src/systems/economy.ts`
  - `src/systems/faction_events.ts`

## Baseline

- `npm run build` passed before implementation.

## Plan

1. Add `src/gen/kvartiry/water_riot.ts` as a standpipe queue POI using social helpers.
2. Spawn a capped cast: queue residents, one liquidator authority, and one wild pressure source.
3. Add water/coupon drops and a theft-risk owner container.
4. Register the POI through the existing social pressure hook.
5. Add contracts and rumors for delivery, defense, and theft paths.
6. Run `npm run check`.

## Implementation

- Added `src/gen/kvartiry/water_riot.ts`.
- Registered `generateWaterRiot()` in `src/gen/kvartiry/content_manifest.ts`.
- Added three side-quest choices:
  - help queue residents by bringing water to Zoya;
  - support Serygin's liquidator water accounting by returning coupons;
  - help Kostyl's wild raiders by bringing water coupons.
- Added one owner-access supply container for theft-risk water/coupon stealing and one public standpipe barrel.
- Added contracts:
  - `kv_water_riot_delivery`;
  - `kv_water_riot_defense`;
  - `kv_water_coupon_heist`.
- Added Kvartiry water-riot rumors for delivery pressure, defense, and theft.
- No `src/data/resources.ts` tuning was needed.

## Polish Notes

- Required player choices: help queue residents, support liquidator ration control, help wild raiders, steal the supply box, or walk away.
- No crowd simulation or population-cap change planned.
- Walk-away path verified by implementation: the room spawns no forced combat trigger, keeps the room passable, and all choices are opt-in via quests/container interaction.

## Validation

- Baseline `npm run build`: passed before implementation.
- Post-change `npm run build`: passed.
- Post-change `npm run smoke`: passed.
- `npm run check`: blocked in `npm run typecheck` by unrelated `src/systems/void_protocols.ts` errors outside AG48 scope.
- Separate `npm run test:unit` attempt did not reach tests because TypeScript compile was also blocked by unrelated workspace errors.
