---
kind: sprite_item_bundle
status: completed
bundle: 1
source_plan_count: 9
source_plan_range: "001-009"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 1
    item_id: "acid_bottle"
    item_name_ru: "Кислота"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 2
    item_id: "aerosol_paint_maiden"
    item_name_ru: "Аэрозольная краска «цвет девства»"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 3
    item_id: "agnia_a130"
    item_name_ru: "А-130 «Агния»"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 4
    item_id: "ak47"
    item_name_ru: "Калашников"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 5
    item_id: "alcohol_bottle"
    item_name_ru: "Спирт"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 6
    item_id: "alkali_powder"
    item_name_ru: "Щёлочная присыпка"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 7
    item_id: "ammo_12g_chemical"
    item_name_ru: "Химический патрон 12 калибра"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 8
    item_id: "ammo_12g_incendiary"
    item_name_ru: "Зажигательная дробь"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 9
    item_id: "ammo_12g_slug"
    item_name_ru: "Пуля 12 калибра"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
---

# Sprite Item Bundle 001: 001-009

## Status

Completed as a shared procedural item sprite pass. This bundle replaces the deleted single-item plan files for the item numbers above; every included item now has a `defId`-derived world-drop sprite and matching inventory/container icon.

## Goal

Create or refine distinct procedural item sprites/icons for every item in this bundle. Each item must remain readable as a world drop and as an inventory/container icon, without adding imported assets, runtime dependencies, save payload sprite ids, or content-specific render branches.

## Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/README.md`.
- Read `Docs/SpriteItems/sprite_item_000_manifest.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this whole bundle, including every item section below.
- Inspect each listed source item file and any systems that reference the included item ids.
- Check `git status --short` and do not overwrite unrelated dirty work.

## Bundle Scope

- Source item plans: 001-009.
- Item count: 9.
- Batches covered: `6_misc_story_trade`, `4_documents_access`, `1_weapons_ammo`, `5_samples_anomalies`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `acid_bottle` | Кислота | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 2 | `aerosol_paint_maiden` | Аэрозольная краска «цвет девства» | `MISC` | document | 4_documents_access | src/data/items.ts |
| 3 | `agnia_a130` | А-130 «Агния» | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 4 | `ak47` | Калашников | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 5 | `alcohol_bottle` | Спирт | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 6 | `alkali_powder` | Щёлочная присыпка | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 7 | `ammo_12g_chemical` | Химический патрон 12 калибра | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 8 | `ammo_12g_incendiary` | Зажигательная дробь | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 9 | `ammo_12g_slug` | Пуля 12 калибра | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |

## Shared Implementation Boundary

- Prefer generic/data-driven additions in `src/render/item_sprites.ts`.
- Keep `src/render/webgl.ts` as a generic item-drop texture hook only.
- Preserve canvas inventory/container readability on desktop and mobile.
- Do not change save/load shape for static item visuals.
- Do not add imported image assets, SVG icon packs, DOM UI, runtime dependencies or asset pipelines.
- If an item requires special handling, encode it through reusable visual tags or resolver helpers that the orchestrator can merge cleanly.

## Shared Visibility Paths

- World visibility: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug visibility: existing item/debug/map-editor paths can spawn item drops for inspection.

## Bundle Acceptance Checklist

- [x] Every listed item id still exists in the current item registries.
- [x] Russian names/descriptions are not translated or accidentally changed.
- [x] Every listed item has a readable 64x64 procedural sprite with transparent background and enough opaque pixels.
- [x] World drops no longer collapse to the generic yellow ball for these items.
- [x] Inventory/container grids show matching recognizable icons.
- [x] No new runtime dependency, asset pipeline, save shape change or content-specific gameplay/render branch.
- [x] Validation from this bundle frontmatter has passed, or the exact blocker is recorded.

# Included Item Plans

## Item 001: acid_bottle

Original metadata from deleted `sprite_item_001.md`:

- `status`: completed
- `item_id`: `acid_bottle`
- `item_name_ru`: Кислота
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: misc/story/trade
- `batch`: 6_misc_story_trade
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `acid_bottle` now has a distinct procedural item sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `acid_bottle` (`Кислота`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `acid_bottle`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `acid_bottle`.
- Russian name: `Кислота`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `40`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Промышленная кислота в бутылке без этикетки.

### Sprite Requirements

- Visual kind: `misc/story/trade`.
- Gameplay read: misc/story/trade; make it visually separable from adjacent items in the same batch.
- Silhouette: один бытовой предмет с грубой пиксельной формой и маленькой биркой/сколом.
- Material/palette: грязный бетон, охра, тусклый красный, один узнаваемый акцент.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none; rely on silhouette and material.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `6_misc_story_trade`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `acid_bottle` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `misc/story/trade` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `acid_bottle`, how it was inspected, and exact checks run.

---

## Item 002: aerosol_paint_maiden

Original metadata from deleted `sprite_item_002.md`:

- `status`: completed
- `item_id`: `aerosol_paint_maiden`
- `item_name_ru`: Аэрозольная краска «цвет девства»
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `aerosol_paint_maiden` now has a distinct damp stamped document sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `aerosol_paint_maiden` (`Аэрозольная краска «цвет девства»`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `aerosol_paint_maiden`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `aerosol_paint_maiden`.
- Russian name: `Аэрозольная краска «цвет девства»`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `72`.
- Spawn weight: `0.2`.
- Stack max through `getStack()`: `3`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `audit`, `black_market`, `contraband`, `mark`, `paint`, `trade`.
- Description: Баллончик с неприлично чистым названием. Купи, спрячь или продай: на стене будет след, в протоколе будет вопрос.

### Sprite Requirements

- Visual kind: `document`.
- Gameplay read: document; make it visually separable from adjacent items in the same batch.
- Silhouette: карточка/талон/лист с черными строками и красной печатью.
- Material/palette: желтая бумага, черные строки, красная печать, серый край влаги.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none; rely on silhouette and material.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `aerosol_paint_maiden` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `document` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `aerosol_paint_maiden`, how it was inspected, and exact checks run.

---

## Item 003: agnia_a130

Original metadata from deleted `sprite_item_003.md`:

- `status`: completed
- `item_id`: `agnia_a130`
- `item_name_ru`: А-130 «Агния»
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `agnia_a130` now has a distinct procedural item sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `agnia_a130` (`А-130 «Агния»`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `agnia_a130`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `agnia_a130`.
- Russian name: `А-130 «Агния»`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `2100`.
- Spawn weight: `0.08`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `cleanup`, `flame`, `fuel_clear`, `liquidator`, `sanitary`, `slime_counterplay`, `technical_cleanup`, `weapon`.
- Description: Санитарный коридорный огнемёт. Урон 2x2. Слабее в бою, ровнее выжигает налёт обычным топливом.

### Sprite Requirements

- Visual kind: `weapon`.
- Gameplay read: weapon; make it visually separable from adjacent items in the same batch.
- Silhouette: диагональный читаемый силуэт оружия; для гранат/зарядов - компактный овал с чекой/пломбой.
- Material/palette: черный/серо-синий металл, ржавчина, один служебный желтый или красный акцент.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none or tiny muzzle/charge accent only.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `agnia_a130` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `weapon` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `agnia_a130`, how it was inspected, and exact checks run.

---

## Item 004: ak47

Original metadata from deleted `sprite_item_004.md`:

- `status`: implemented
- `item_id`: `ak47`
- `item_name_ru`: Калашников
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented in `src/render/item_sprites.ts`. The sprite is generated from `defId`, so it is visible through the generic world-drop texture hook and the shared inventory/container icon renderer.

### Goal

Create a distinct procedural sprite/icon for `ak47` (`Калашников`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ak47`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ak47`.
- Russian name: `Калашников`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `1500`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `ammo_burn`, `old_world`, `rifle`, `story_reward`, `weapon`.
- Description: Старый АК-47 из довоенной оружейки. Урон 19. Точнее уставного автомата, но каждая очередь жжёт редкие 7.62.

### Sprite Requirements

- Visual kind: `weapon`.
- Gameplay read: weapon; make it visually separable from adjacent items in the same batch.
- Silhouette: диагональный читаемый силуэт оружия; для гранат/зарядов - компактный овал с чекой/пломбой.
- Material/palette: черный/серо-синий металл, ржавчина, один служебный желтый или красный акцент.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none or tiny muzzle/charge accent only.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ak47` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `weapon` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `ak47`, how it was inspected, and exact checks run.

---

## Item 005: alcohol_bottle

Original metadata from deleted `sprite_item_005.md`:

- `status`: completed
- `item_id`: `alcohol_bottle`
- `item_name_ru`: Спирт
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: misc/story/trade
- `batch`: 6_misc_story_trade
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `alcohol_bottle` now has a narrow technical-spirit bottle sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `alcohol_bottle` (`Спирт`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `alcohol_bottle`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `alcohol_bottle`.
- Russian name: `Спирт`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `30`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Технический спирт. Медики смотрят строго.

### Sprite Requirements

- Visual kind: `misc/story/trade`.
- Gameplay read: misc/story/trade; make it visually separable from adjacent items in the same batch.
- Silhouette: один бытовой предмет с грубой пиксельной формой и маленькой биркой/сколом.
- Material/palette: грязный бетон, охра, тусклый красный, один узнаваемый акцент.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none; rely on silhouette and material.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `6_misc_story_trade`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `alcohol_bottle` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `misc/story/trade` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `alcohol_bottle`, how it was inspected, and exact checks run.

---

## Item 006: alkali_powder

Original metadata from deleted `sprite_item_006.md`:

- `status`: implemented
- `item_id`: `alkali_powder`
- `item_name_ru`: Щёлочная присыпка
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: sample/anomaly
- `batch`: 5_samples_anomalies
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented in `src/render/item_sprites.ts` as a stained grey reagent packet with green-blue alkali dust and a brown slime cue. The sprite is generated from `defId`, so it is visible through the generic world-drop texture hook and the shared inventory/container icon renderer.

### Goal

Create a distinct procedural sprite/icon for `alkali_powder` (`Щёлочная присыпка`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `alkali_powder`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `alkali_powder`.
- Russian name: `Щёлочная присыпка`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `28`.
- Spawn weight: `0.7`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `alkali`, `brown_slime`, `cleanup`, `reagent`, `slime`.
- Description: Серый пакет щёлочной пыли для коричневой слизи. Сэкономь бензин: отнеси к акту, печи или продай цеху.

### Sprite Requirements

- Visual kind: `sample/anomaly`.
- Gameplay read: sample/anomaly; make it visually separable from adjacent items in the same batch.
- Silhouette: банка/ампула с веществом; если опасно - глазоподобный пузырь внутри.
- Material/palette: стекло/банка, слизь, фиолетовый/кислотно-зеленый/синий glow по tags.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: weak wet organic glow or glossy slime highlight.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `alkali_powder` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `sample/anomaly` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `alkali_powder`, how it was inspected, and exact checks run.

---

## Item 007: ammo_12g_chemical

Original metadata from deleted `sprite_item_007.md`:

- `status`: completed
- `item_id`: `ammo_12g_chemical`
- `item_name_ru`: Химический патрон 12 калибра
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `ammo_12g_chemical` now has a distinct decon-coded 12 gauge shell sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `ammo_12g_chemical` (`Химический патрон 12 калибра`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_12g_chemical`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_12g_chemical`.
- Russian name: `Химический патрон 12 калибра`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `90`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `ammo`, `chemical`, `decon`, `issue_stash`, `liquidator`, `nii`, `reagent`, `shells`, `special_shell`.
- Description: Запаянный спецпатрон НИИ для зачистки слизи. Обычный дробовик его не подаёт: берегите как боезапас или вскройте в реагент.

### Sprite Requirements

- Visual kind: `ammo`.
- Gameplay read: ammo; make it visually separable from adjacent items in the same batch.
- Silhouette: 3-5 вертикальных патронов/гильз или один спецснаряд с цветовой полосой.
- Material/palette: латунь, темная гильза, красный/зеленый/оранжевый код боеприпаса.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none or tiny muzzle/charge accent only.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ammo_12g_chemical` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `ammo` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `ammo_12g_chemical`, how it was inspected, and exact checks run.

---

## Item 008: ammo_12g_incendiary

Original metadata from deleted `sprite_item_008.md`:

- `status`: completed
- `item_id`: `ammo_12g_incendiary`
- `item_name_ru`: Зажигательная дробь
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `ammo_12g_incendiary` now has a distinct fire-coded slime-cleanup shell sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `ammo_12g_incendiary` (`Зажигательная дробь`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_12g_incendiary`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_12g_incendiary`.
- Russian name: `Зажигательная дробь`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `48`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `12`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `12g`, `ammo`, `cleanup`, `counterplay`, `fire`, `fuel_input`, `fungus`, `incendiary`, `liquidator`, `rare_hq`, `shells`, `shotgun`, `slime`.
- Description: Редкие 12 калибра с горючей обмазкой. E: выжечь близкий налёт слизи или грибницы без селектора патронов.

### Sprite Requirements

- Visual kind: `ammo`.
- Gameplay read: ammo; make it visually separable from adjacent items in the same batch.
- Silhouette: 3-5 вертикальных патронов/гильз или один спецснаряд с цветовой полосой.
- Material/palette: латунь, темная гильза, красный/зеленый/оранжевый код боеприпаса.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: weak wet organic glow or glossy slime highlight.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ammo_12g_incendiary` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `ammo` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `ammo_12g_incendiary`, how it was inspected, and exact checks run.

---

## Item 009: ammo_12g_slug

Original metadata from deleted `sprite_item_009.md`:

- `status`: completed
- `item_id`: `ammo_12g_slug`
- `item_name_ru`: Пуля 12 калибра
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Completed. `ammo_12g_slug` now has a distinct heavy single-shell sprite derived from its `defId`, visible through the shared item-drop texture path and inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `ammo_12g_slug` (`Пуля 12 калибра`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_12g_slug`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_12g_slug`.
- Russian name: `Пуля 12 калибра`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `28`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `12`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `ammo`, `anti_armor`, `armory_bench`, `hq_issue`, `liquidator`, `precision`, `shells`, `shotgun`, `slug`.
- Description: Тяжёлая пуля для точной зачистки. В шкафу она идёт поштучно: украсть из описи, выбить на станке или сберечь до плохого коридора.

### Sprite Requirements

- Visual kind: `ammo`.
- Gameplay read: ammo; make it visually separable from adjacent items in the same batch.
- Silhouette: 3-5 вертикальных патронов/гильз или один спецснаряд с цветовой полосой.
- Material/palette: латунь, темная гильза, красный/зеленый/оранжевый код боеприпаса.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: none or tiny muzzle/charge accent only.
- Reference style: current monster procedural sprites, durak card masks, billboard/poster blocks, and rare eye motifs. Do not copy external art.

### Implementation Boundary

- Prefer adding or refining generic branches in `src/render/item_sprites.ts`.
- Do not add imported image assets, runtime dependencies, SVG icon packs, DOM UI or asset pipelines.
- Do not add item-specific gameplay logic to `src/render/webgl.ts`, `src/main.ts`, or `src/core/world.ts`.
- Do not serialize sprite ids into save payload; derive visuals from `defId`.
- If this item needs a truly special visual, add data-driven tags/visual metadata and let the orchestrator merge the registry once.

### Reachability / Visibility

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ammo_12g_slug` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `ammo` items.
- [x] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [x] Item drop in world no longer appears as the generic yellow ball.
- [x] Inventory/container grid shows the same recognizable item icon.
- [x] No new runtime dependency or asset pipeline.
- [x] No save shape change unless explicitly justified.
- [x] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [x] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `ammo_12g_slug`, how it was inspected, and exact checks run.
