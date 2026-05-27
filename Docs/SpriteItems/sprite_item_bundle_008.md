---
kind: sprite_item_bundle
status: planned
bundle: 8
source_plan_count: 9
source_plan_range: "064-072"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 64
    item_id: "card_deck"
    item_name_ru: "Колода карт"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 65
    item_id: "cardboard_stack"
    item_name_ru: "Картон"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 66
    item_id: "ceramic_shards_pack"
    item_name_ru: "Керамика"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "repair/material"
    batch: "3_tools_repair_cleanup"
  - n: 67
    item_id: "chain"
    item_name_ru: "Цепь"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 68
    item_id: "chainsaw"
    item_name_ru: "Бензопила"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 69
    item_id: "chalk"
    item_name_ru: "Мелок"
    item_type: "TOOL"
    source_item_file: "src/data/items.ts"
    visual_kind: "tool"
    batch: "3_tools_repair_cleanup"
  - n: 70
    item_id: "chernobog_cell_map"
    item_name_ru: "Схема ячеек ЧБ-0"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 71
    item_id: "chernobog_confiscation_act"
    item_name_ru: "Акт изъятия черной ладони"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 72
    item_id: "chernobog_external_cell_index"
    item_name_ru: "Индекс внешней ячейки"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
---

# Sprite Item Bundle 008: 064-072

## Status

Planned as one future parallel worker task. This bundle replaces the deleted single-item plan files for the item numbers above; finish every included item before marking the bundle complete.

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

- Source item plans: 064-072.
- Item count: 9.
- Batches covered: `6_misc_story_trade`, `3_tools_repair_cleanup`, `1_weapons_ammo`, `5_samples_anomalies`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 64 | `card_deck` | Колода карт | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 65 | `cardboard_stack` | Картон | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 66 | `ceramic_shards_pack` | Керамика | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 67 | `chain` | Цепь | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 68 | `chainsaw` | Бензопила | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 69 | `chalk` | Мелок | `TOOL` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 70 | `chernobog_cell_map` | Схема ячеек ЧБ-0 | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 71 | `chernobog_confiscation_act` | Акт изъятия черной ладони | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 72 | `chernobog_external_cell_index` | Индекс внешней ячейки | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |

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

- [ ] Every listed item id still exists in the current item registries.
- [ ] Russian names/descriptions are not translated or accidentally changed.
- [ ] Every listed item has a readable 64x64 procedural sprite with transparent background and enough opaque pixels.
- [ ] World drops no longer collapse to the generic yellow ball for these items.
- [ ] Inventory/container grids show matching recognizable icons.
- [ ] No new runtime dependency, asset pipeline, save shape change or content-specific gameplay/render branch.
- [ ] Validation from this bundle frontmatter has passed, or the exact blocker is recorded.

# Included Item Plans

## Item 064: card_deck

Original metadata from deleted `sprite_item_064.md`:

- `status`: planned
- `item_id`: `card_deck`
- `item_name_ru`: Колода карт
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: misc/story/trade
- `batch`: 6_misc_story_trade
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `card_deck` (`Колода карт`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `card_deck`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `card_deck`.
- Russian name: `Колода карт`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `22`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `cards`, `durak`, `resident_good`, `trade`.
- Description: Засаленная колода для кухонного дурака, долговой паузы и разговора, который проще вести через козыри.

### Sprite Requirements

- Visual kind: `misc/story/trade`.
- Gameplay read: misc/story/trade; make it visually separable from adjacent items in the same batch.
- Silhouette: маленькая темная колода как durak card back: прямоугольник, сетка, знак ГХ/глаз без текста.
- Material/palette: советская бытовуха: эмаль, бумага, бакелит, выцветший зеленый.
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

- [ ] `card_deck` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `misc/story/trade` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `card_deck`, how it was inspected, and exact checks run.

---

## Item 065: cardboard_stack

Original metadata from deleted `sprite_item_065.md`:

- `status`: planned
- `item_id`: `cardboard_stack`
- `item_name_ru`: Картон
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: misc/story/trade
- `batch`: 6_misc_story_trade
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `cardboard_stack` (`Картон`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `cardboard_stack`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `cardboard_stack`.
- Russian name: `Картон`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `3`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `20`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `material`, `paper`, `resident_good`.
- Description: Стопка картона для коробок, табличек и тихого подкладывания под шаткий шкаф.

### Sprite Requirements

- Visual kind: `misc/story/trade`.
- Gameplay read: misc/story/trade; make it visually separable from adjacent items in the same batch.
- Silhouette: один бытовой предмет с грубой пиксельной формой и маленькой биркой/сколом.
- Material/palette: советская бытовуха: эмаль, бумага, бакелит, выцветший зеленый.
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

- [ ] `cardboard_stack` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `misc/story/trade` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `cardboard_stack`, how it was inspected, and exact checks run.

---

## Item 066: ceramic_shards_pack

Original metadata from deleted `sprite_item_066.md`:

- `status`: planned
- `item_id`: `ceramic_shards_pack`
- `item_name_ru`: Керамика
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: repair/material
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ceramic_shards_pack` (`Керамика`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ceramic_shards_pack`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ceramic_shards_pack`.
- Russian name: `Керамика`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `8`.
- Spawn weight: `0.8`.
- Stack max through `getStack()`: `12`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `ceramic`, `insulation`, `material`, `production`, `trade`.
- Description: Пакет белой керамики из автомагазина: изолятор, осколок, доказательство бытового прогресса.

### Sprite Requirements

- Visual kind: `repair/material`.
- Gameplay read: repair/material; make it visually separable from adjacent items in the same batch.
- Silhouette: моток/лист/деталь/трубка, грязный край и ржавая кромка.
- Material/palette: бетонная пыль, ржавая арматура, резина, суровая промышленная охра.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `3_tools_repair_cleanup`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `ceramic_shards_pack` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `repair/material` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `ceramic_shards_pack`, how it was inspected, and exact checks run.

---

## Item 067: chain

Original metadata from deleted `sprite_item_067.md`:

- `status`: planned
- `item_id`: `chain`
- `item_name_ru`: Цепь
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chain` (`Цепь`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `chain`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chain`.
- Russian name: `Цепь`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `60`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Ржавая цепь. Урон 14. Длинная, быстрая для своей длины и неровная. Прочность 75

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

- [ ] `chain` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `weapon` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chain`, how it was inspected, and exact checks run.

---

## Item 068: chainsaw

Original metadata from deleted `sprite_item_068.md`:

- `status`: planned
- `item_id`: `chainsaw`
- `item_name_ru`: Бензопила
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chainsaw` (`Бензопила`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `chainsaw`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chainsaw`.
- Russian name: `Бензопила`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `3200`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Бензопила. Урон 42. Паническая мясорубка на несколько ударов. Прочность 14

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

- [ ] `chainsaw` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `weapon` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chainsaw`, how it was inspected, and exact checks run.

---

## Item 069: chalk

Original metadata from deleted `sprite_item_069.md`:

- `status`: planned
- `item_id`: `chalk`
- `item_name_ru`: Мелок
- `item_type`: `TOOL`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: tool
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chalk` (`Мелок`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `chalk`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chalk`.
- Russian name: `Мелок`.
- Type: `TOOL`.
- Source file: `src/data/items.ts`.
- Value: `6`.
- Spawn weight: `0.9`.
- Stack max through `getStack()`: `1`.
- Equip slot: `tool`.
- Has use action: `no`.
- Tags: `map_mark`, `route_marker`, `tool`, `trade`.
- Description: Короткий цветной мелок. Зажмите R: оставляет тонкую пиксельную метку под ногами, видимую на карте.

### Sprite Requirements

- Visual kind: `tool`.
- Gameplay read: tool; make it visually separable from adjacent items in the same batch.
- Silhouette: рабочий предмет в 3/4: ручка, головка, провод или луч.
- Material/palette: потертый металл, резина, изолента, рабочий циан/желтый акцент.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `3_tools_repair_cleanup`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `chalk` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `tool` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chalk`, how it was inspected, and exact checks run.

---

## Item 070: chernobog_cell_map

Original metadata from deleted `sprite_item_070.md`:

- `status`: planned
- `item_id`: `chernobog_cell_map`
- `item_name_ru`: Схема ячеек ЧБ-0
- `item_type`: `MISC`
- `source_item_file`: `src/data/chernobog_docket.ts`
- `visual_kind`: artifact/psi
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chernobog_cell_map` (`Схема ячеек ЧБ-0`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_cell_map`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_cell_map`.
- Russian name: `Схема ячеек ЧБ-0`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `180`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Карта центральной и внешней ячеек. Пустые адреса отмечены пустыми; рядом вписаны свидетели и время обхода.

### Sprite Requirements

- Visual kind: `artifact/psi`.
- Gameplay read: artifact/psi; make it visually separable from adjacent items in the same batch.
- Silhouette: невозможный бытовой предмет: бетон/эмаль плюс внутреннее свечение.
- Material/palette: фиолетово-синий glow, бетон/мясо/эмаль, редкий глазной мотив.
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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `chernobog_cell_map` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `artifact/psi` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chernobog_cell_map`, how it was inspected, and exact checks run.

---

## Item 071: chernobog_confiscation_act

Original metadata from deleted `sprite_item_071.md`:

- `status`: planned
- `item_id`: `chernobog_confiscation_act`
- `item_name_ru`: Акт изъятия черной ладони
- `item_type`: `MISC`
- `source_item_file`: `src/data/chernobog_docket.ts`
- `visual_kind`: artifact/psi
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chernobog_confiscation_act` (`Акт изъятия черной ладони`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_confiscation_act`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_confiscation_act`.
- Russian name: `Акт изъятия черной ладони`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `150`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Изъят предмет: дощечка с черной ладонью. Свидетель записан в приложение Б.

### Sprite Requirements

- Visual kind: `artifact/psi`.
- Gameplay read: artifact/psi; make it visually separable from adjacent items in the same batch.
- Silhouette: невозможный бытовой предмет: бетон/эмаль плюс внутреннее свечение.
- Material/palette: фиолетово-синий glow, бетон/мясо/эмаль, редкий глазной мотив.
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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `chernobog_confiscation_act` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `artifact/psi` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chernobog_confiscation_act`, how it was inspected, and exact checks run.

---

## Item 072: chernobog_external_cell_index

Original metadata from deleted `sprite_item_072.md`:

- `status`: planned
- `item_id`: `chernobog_external_cell_index`
- `item_name_ru`: Индекс внешней ячейки
- `item_type`: `MISC`
- `source_item_file`: `src/data/chernobog_docket.ts`
- `visual_kind`: artifact/psi
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `chernobog_external_cell_index` (`Индекс внешней ячейки`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_external_cell_index`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_external_cell_index`.
- Russian name: `Индекс внешней ячейки`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `130`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Список жильцов с графой "не культ". У половины графа заполнена чужим почерком.

### Sprite Requirements

- Visual kind: `artifact/psi`.
- Gameplay read: artifact/psi; make it visually separable from adjacent items in the same batch.
- Silhouette: невозможный бытовой предмет: бетон/эмаль плюс внутреннее свечение.
- Material/palette: фиолетово-синий glow, бетон/мясо/эмаль, редкий глазной мотив.
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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `chernobog_external_cell_index` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `artifact/psi` items.
- [ ] 64x64 procedural sprite has transparent background and enough opaque pixels.
- [ ] Item drop in world no longer appears as the generic yellow ball.
- [ ] Inventory/container grid shows the same recognizable item icon.
- [ ] No new runtime dependency or asset pipeline.
- [ ] No save shape change unless explicitly justified.
- [ ] Samosbor does not need special handling because the sprite is derived from surviving item payload.
- [ ] Validation command named in final report.

### Validation

- Run `npm run typecheck` for a narrow sprite rule change.
- Prefer `npm run test:unit` if `src/render/item_sprites.ts` is touched.
- Run `npm run check` and browser smoke if shared WebGL/UI layout changes.

### Final Report Notes

Report changed files, visual rule chosen for `chernobog_external_cell_index`, how it was inspected, and exact checks run.
