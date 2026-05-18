# Status_AG102_ZHELEMISH_CELLAR

Agent: AG102_ZHELEMISH_CELLAR  
Domain: Living zhelemish cellar POI  
Started: 2026-05-18

## Preflight

- [x] Extracted `AGENT_102_ZHELEMISH_CELLAR` XML block from `Docs/AgentPrompts/AGENT_102_ZHELEMISH_CELLAR.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` section 16.5.
- [x] Read `src/gen/living/mushroom_cellar.ts`.
- [x] Read `src/gen/living/zone_content.ts`.
- [x] Read `src/gen/kvartiry/content_manifest.ts`.
- [x] Read `src/systems/containers.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Ran baseline `npm run typecheck`: blocked, `package.json` has no `typecheck` script.

## Implementation Status

- [x] Add reachable cellar/storage room with finite zhelemish growth, owner, witness and contaminated storage.
- [x] Add choices for harvest, steal, buy/share, burn, report/surrender and seal off.
- [x] Keep contamination local through marks, containers, NPC text and rumor lead.
- [x] Publish visible events through existing quest/container event channels.
- [x] Add at least one reward and one social cost.
- [x] Run available validation.

## Notes

- `AG101` item/resource definitions are present as `zhelemish_raw`, `zhelemish_dried`, `zhelemish_boiled` and resource `zhelemish`; this slice depends only on those stable ids.
- Available npm scripts are `dev`, `build` and `preview`; `npm run check` is absent unless `package.json` changes outside this task.

## Event Channels

- Harvest: taking from `Общий поддон желемыша` publishes `container_opened` with tags `zhelemish`, `harvest`, `resource`.
- Theft: taking from `Запертый запас Мавры` publishes `item_stolen` with owner/witness/audit data and citizen relation cost.
- Share: depositing food into `Общая миска для доли` publishes `item_deposited` with `resident_relief` tags.
- Report/surrender: depositing `zhelemish_raw` into `Санитарный ящик сдачи` publishes `item_deposited` with `evidence`, `report`, `surrender`, `quarantine` tags.
- Burn: depositing `ammo_fuel` into `Жаровня мокрой партии` publishes `item_deposited` with `sabotage`, `burn`, `fire` tags.
- Buy/share, burn, report, seal and owner resolution quests publish `quest_created`/`quest_completed` with AG102 `eventTags`.

## Validation

- `npm run typecheck`: failed before implementation because script is missing from `package.json`.
- `npm run check`: failed because script is missing from `package.json`.
- `npx tsc --noEmit`: fails on pre-existing unrelated files (`src/main.ts`, `src/systems/faction_events.ts`, `src/systems/contracts.ts`, etc.); filtered output shows no AG102-owned file errors.
- `npm run build`: fails on pre-existing `src/main.ts` import of missing `tryUseProceduralFloorAnomaly` from `src/systems/procedural_anomalies.ts`; Vite also warns about a duplicate `maronary_shaving` case in `src/systems/rumor.ts`.
