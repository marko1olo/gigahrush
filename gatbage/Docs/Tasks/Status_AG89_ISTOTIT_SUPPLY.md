# AG89 Istotit Church Supply Status

Date: 2026-05-18

## Scope

- Prompt: `AGENT_89_ISTOTIT_CHURCH_SUPPLY`
- Goal: limited communal supply cache with candles, water, food, documents, theft/share/guard/report/barter pressure.
- Write scope: one Living content module, Living manifest registration, narrow item/rumor additions, status/log docs.

## Preflight

- [x] Extracted prompt XML block by id from `Docs/AgentPrompts/AGENT_89_ISTOTIT_CHURCH_SUPPLY.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `istotit.md`.
- [x] Read `desdoc.md` section 16.3.
- [x] Read `src/gen/living/temple.ts`.
- [x] Read `src/gen/kvartiry/red_corner.ts`.
- [x] Read `src/systems/containers.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Read `src/data/items.ts`.
- [x] Baseline `npm run typecheck`: failed before implementation because `package.json` only exposes `dev`, `build`, and `preview`.
- [x] Baseline fallback `npx tsc --noEmit`: pass.

## Implementation Checklist

- [x] Add finite communal supply cache POI.
- [x] Add candles/water/food/documents without creating a free supply fountain.
- [x] Use owned/faction containers so theft has witness/audit consequences.
- [x] Add share, guard, report, and barter paths through existing quest/event systems.
- [x] Publish outcome events with rumor hooks.
- [x] Add helped/stole/report/guard/barter rumors.
- [x] Run `npm run check` attempt.

## Notes

- Existing container theft already publishes `item_stolen` with witness, audit, relation and rumor paths.
- Specific AG89 social outcomes will be republished from quest/container events through a content-local observer.
- Added `src/gen/living/istotit_supply_cache.ts` and imported it from `src/gen/living/content_manifest.ts`.
- Added item `istotit_candle` with `spawnW: 0`; it only enters play through finite cache/quest rewards.
- Added rumors `living_istotit_supply_cache`, `living_istotit_supply_helped`, `living_istotit_supply_stolen`, `living_istotit_supply_reported`, `living_istotit_supply_guarded`, and `living_istotit_supply_bartered`.

## Validation

- Baseline `npm run typecheck`: failed before implementation because the script is missing from `package.json`.
- Baseline fallback `npx tsc --noEmit`: pass.
- Post-change `npx tsc --noEmit`: blocked by unrelated workspace errors outside AG89 files, including `src/entities/monster.ts`, `src/gen/procedural_floor.ts`, `src/gen/ministry/chernobog_archive_docket.ts`, `src/systems/lift_arachna.ts`, `src/systems/contracts.ts`, `src/systems/faction_events.ts`, `src/systems/quests.ts`, and `src/systems/samosbor.ts`.
- Targeted diagnostic grep for AG89-touched files after post-change compile: no diagnostics for `src/gen/living/istotit_supply_cache.ts`, `src/gen/living/content_manifest.ts`, `src/data/items.ts`, or `src/data/rumors.ts`.
- `npm run build`: blocked by unrelated `src/gen/procedural_floor.ts` duplicate `roomCenter` declaration.
- `npm run check`: failed because the script is missing from `package.json`.
