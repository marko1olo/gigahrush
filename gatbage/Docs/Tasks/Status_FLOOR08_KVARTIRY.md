# Status FLOOR08 KVARTIRY

## Scope

- Prompt: `FLOOR08_KVARTIRY`
- Domain: existing Kvartiry expansion / dense social riot / route consequences.
- Owned files:
  - `src/gen/kvartiry/kv08_route_assembly.ts`
  - `Docs/Tasks/Status_FLOOR08_KVARTIRY.md`
  - `Docs/AgentLogs/LOG_FLOOR08_KVARTIRY.md`
- Cautious shared edit:
  - `src/gen/kvartiry/content_manifest.ts`

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md`.
- Read `Docs/DesignFloors/INDEX.md`.
- Read `Docs/DesignFloors/floor_contract.md`.
- Read `Docs/DesignFloors/kvartiry.md`.
- Read `Docs/DesignFloors/AgentPrompts/floor08_kvartiry.md`.
- Read source references:
  - `src/gen/kvartiry/content_manifest.ts`
  - `src/gen/kvartiry/social_pressure.ts`
  - `src/gen/kvartiry/social_helpers.ts`
  - `src/data/resources.ts`
- Additional local pattern reads:
  - `src/gen/kvartiry/water_riot.ts`
  - `src/gen/kvartiry/barricade.ts`
  - `src/gen/kvartiry/communal_kitchen_feud.ts`
  - `src/systems/events.ts`
  - `src/systems/quests.ts`
  - `src/systems/containers.ts`
  - `src/systems/rumor.ts`

## Baseline

- `npm run build` passed before implementation.

## Implementation Plan

1. Add one protected Kvartiry social POI that stages a route assembly conflict.
2. Register three side-quest outcomes through existing `registerSideQuest`.
3. Add bounded NPCs only; no crowd simulation or cap change.
4. Add route containers that use existing container theft/open events and rumor bridge.
5. Wire the module through `src/gen/kvartiry/content_manifest.ts`.
6. Run `npm run check`.

## Implementation

- Added `src/gen/kvartiry/kv08_route_assembly.ts`.
- Added POI `Маршрутный сход Три Двери`.
- Added three route outcomes:
  - `kv08_open_manhattan_crossroads`: support liquidator route cutting toward Manhattan Crossroads.
  - `kv08_hold_communal_ring`: support citizen safe-chain route toward Communal Ring.
  - `kv08_sell_market_88_lane`: support wild/black-market route sale toward Market 88.
- Added three outcome NPCs:
  - Боря Прорез, liquidator route cutter.
  - Марина Кольцевая, citizen safe-chain organizer.
  - Соня Восьмая, Market 88 broker.
- Added three ambient witnesses/pressure NPCs.
- Added three route containers:
  - `Папка прореза к Перекрёсткам`
  - `Общая сумка Коммунального кольца`
  - `Курьерский сейф рынка 88`
- Added an event observer for the three side quest ids. It publishes a route-outcome `faction_relation_changed` world event with `kv08_route_outcome` tags when one outcome is completed.
- Registered the POI in `src/gen/kvartiry/content_manifest.ts`.

## Event And Route Notes

- Outcome completion uses existing quest event publication in `systems/quests.ts`: completing one of the three side quests publishes `quest_completed` with the chosen `sideQuestId`.
- The module observes that event through `registerWorldEventObserver()` and publishes an explicit route-outcome event through `publishEvent()`.
- Theft or opening route containers uses existing `item_stolen` / `container_opened` events and the rumor bridge.
- Route impact is represented with current shipped primitives: route NPC lines, quest descriptions, reward documents, route-tagged containers and theft/quest events.

## Polish Notes

- Active NPCs added by the new content: 6 total.
- The NPC count is fixed and does not scale with room count or world size.
- No population cap, runtime crowd loop, core enum, `main.ts`, or Kvartiry population logic was changed.
- Walk-away path exists: the room remains passable and all outcomes are opt-in through quests or container interaction.

## Validation

- Baseline `npm run build`: passed before implementation.
- Post-change `npm run check`: passed.
  - `npm run typecheck`: passed.
  - `npm run test:unit`: passed.
  - `npm run build`: passed.
  - `npm run smoke`: passed, including nonblank HUD/scene smoke at local preview URL.
