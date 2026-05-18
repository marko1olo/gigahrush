# Status AG43 Cartographer

## Prompt

Extracted prompt id: `AGENT_43_LIVING_CARTOGRAPHER_ZONE_MAP`.

Goal: add a reachable LIVING cartographer / zone-map POI that turns rumors into bounded expedition leads: floor, zone, room type, danger, and optional container or monster hint.

## Implementation

- Added `src/gen/living/cartographer_zone_map.ts`.
- Registered `Комната живой карты` through `src/gen/living/content_manifest.ts` at LIVING zone HUD 53.
- Stamped one protected, reachable office room with a real door and corridor connection.
- Spawned `Сева Картограф` as a side-quest NPC with route goods in trade inventory.
- Added owner container `Картотека живых маршрутов` with `caravan_route`, `child_map`, `lift_scheme`, and notes; taking from it uses existing container theft events.
- Added side quests:
  - `ag43_cartographer_maintenance_lead`: a VISIT lead to `Коллекторы`, zone 47, production/water risk, danger 4/5, tube eel, filter/flashlight clue.
  - `ag43_cartographer_crosscheck_notes`: help path that trades notes for a lift scheme and child map.
- Extended `src/data/rumors.ts` with multi-part cartographer route rumors.
- Extended `src/systems/rumor.ts` so multi-field `reveals` can format as player-facing `Зацепка` route text.

## Player Verification

1. Start on `Жилая зона`.
2. Find `Комната живой карты` in zone HUD 53.
3. Talk to `Сева Картограф`.
4. Use `Задание` to accept the lower-route lead.
5. Confirm the quest text answers where to go next: `Коллекторы`, zone 47, production room near water, danger 4/5, tube eel risk, filter/flashlight/container clue.
6. Choose one route-lead path:
   - Trade for `Маршрут каравана`, `Карта детей`, or `Схема лифтов`.
   - Steal from `Картотека живых маршрутов`.
   - Help by completing the route-check or note cross-check quest.
7. Take a lift toward `Коллекторы`; the VISIT quest completes on arrival through existing quest events.

## Rumor Verification

Route rumors added:

- `cartographer_maintenance_pressure_lead`
- `cartographer_ministry_archive_lead`
- `cartographer_kvartiry_kitchen_lead`
- `cartographer_living_storage_lead`

Expected text style: `Зацепка: Коллекторы, зона 47, производственная, опасность 4/5, трубный угорь, инструментальный шкаф, фильтр противогаза.`

These clues avoid TypeScript ids and tell the player a practical expedition target.

## Validation

- Baseline `npm run typecheck`: passed before edits.
- Final `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run check`: failed in `test:unit`, after typecheck passed. Failing assertion:
  - `tests/events-economy.test.ts`: `NPC assignment offer can use contract templates as timed contract quests`
  - expected `bm88_debt_payment`, actual `undefined`.
- `npm run smoke`: failed on existing canvas-pixel checks:
  - WebGL canvas appears blank after movement.
  - Inventory panel brightness did not change enough.

No map marker support was added; the feature remains text/quest/container bounded and current systems handle events.
