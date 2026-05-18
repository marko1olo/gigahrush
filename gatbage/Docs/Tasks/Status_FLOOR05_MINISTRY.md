# Status FLOOR05 MINISTRY

## Preflight

- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/ministry.md`.
- Read Ministry/content references: `src/gen/ministry/content_manifest.ts`, `src/gen/ministry/index.ts`, `src/data/plot.ts`, `src/data/contracts.ts`, `src/entities/monster.ts`.
- Baseline `npm run build`: passed before edits.

## Scope

- Owned implementation file: `src/gen/design_floors/ministry.ts`.
- Manifest hook: `src/gen/ministry/content_manifest.ts`.
- Docs: this status file and `Docs/AgentLogs/LOG_FLOOR05_MINISTRY.md`.

## Plan

- Added an additive Ministry design-floor slice with a route-paper gate.
- Registered four Ministry NPCs and four side quests:
  - route clerk / floor pass,
  - market inspector / Market 88 case,
  - shelter commissar / shelter list,
  - lift notary / monster clause.
- Kept state public through existing quest/container/item events rather than private module state.
- Validated with `npm run check`.

## Reachability

- `runMinistryDesignFloorContent()` is called by `runMinistryContent()` in `src/gen/ministry/content_manifest.ts`, so it runs whenever `FloorLevel.MINISTRY` is generated.
- Existing debug command 21 already teleports to `FloorLevel.MINISTRY`; normal floor-run route also reaches Ministry at `z=-6`.
- Compiled reachability probe generated `FloorLevel.MINISTRY` and found:
  - room: `Бюро маршрутных бумаг`;
  - NPCs: `Семен Маршрутный`, `Инспектор Контррынок`, `Клавдия Укрытная`, `Нотарий Кабинный`;
  - quests: `ministry_floor_pass`, `ministry_market_case`, `ministry_shelter_list`, `ministry_monster_clause`;
  - owner-access route-paper safe with `key`, `official_permit_slip`, `emergency_roster`, `elevator_access_order`;
  - locked route gate and paper monsters present.

## Validation

- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after edits.
- First `npm run check`: unit suites passed until the runner reported missing compiled `procedural-floors.test.js`; the file existed afterward and direct execution of that suite passed.
- Rerun `npm run test:unit`: passed.
- Final `npm run check`: passed, including typecheck, unit tests, build and smoke.
