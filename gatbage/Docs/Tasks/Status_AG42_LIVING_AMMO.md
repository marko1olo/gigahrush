# Status AG42 Living Ammo Scarcity Loop

## Scope

- Prompt: `AGENT_42_LIVING_AMMO_SCARCITY_LOOP`
- Domain: Living POI / ammo / trade-theft-quest
- Owned files: new Living content module, Living content manifest, contracts, rumors.

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` sections P0.1, P0.5, and P2.
- Read Living content hooks and nearby modules:
  - `src/gen/living/content_manifest.ts`
  - `src/gen/living/zone_content.ts`
  - `src/gen/living/market.ts`
  - `src/gen/living/black_market_88.ts`
- Read relevant data/systems:
  - `src/data/items.ts`
  - `src/data/weapons.ts`
  - `src/data/contracts.ts`
  - `src/data/rumors.ts`
  - `src/data/container_defs.ts`
  - `src/systems/containers.ts`

## Plan

1. Run baseline `npm run build`. Done: passed before AG42 code edits.
2. Add a permanent Living ammo locker POI with protected room cells and corridor connection. Done.
3. Add low-count legal stock, theft stock, and one small task reward path. Done.
4. Add a contract and rumor pointing players to the source. Done.
5. Run `npm run check`. Done: blocked at existing `src/systems/faction_events.ts` type errors.

## Balance Notes

- Keep visible ammo low: enough for confidence, not enough to clear the floor.
- Prefer 9mm as early defensive ammunition, with a few shells only behind theft/risk.

## Implementation

- Added `src/gen/living/domkom_ammo_locker.ts`.
- Registered it from `src/gen/living/content_manifest.ts`.
- Added Living contract `living_domkom_ammo_parts`.
- Added rumors:
  - `container_domkom_ammo_locker`
  - `contract_domkom_ammo_parts`
- Applied a narrow optional-state guard in `src/render/map_ui.ts` while investigating validation blockers.

Routes:

- Legal: buy a few rounds from Zoya Patronnaya through normal NPC trade.
- Theft: take low-count ammo from owner/faction containers in the locker room.
- Task: bring one `magazine_part` to Zoya for a small 9mm reward and one shell.

## Validation

- Baseline `npm run build`: passed before AG42 edits.
- Post-change `npm run build`: passed.
- `npm run smoke`: passed.
- `npm run typecheck`: blocked by non-AG42 `src/systems/faction_events.ts` errors.
- `npm run test:unit`: blocked by the same `faction_events.ts` errors plus an existing `tests/content-registry.test.ts` rumor reveal type mismatch.
- `npm run check`: blocked because it starts with the failing typecheck.
