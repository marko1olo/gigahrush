---
kind: sprite_item_bundle
status: complete
bundle: 48
source_plan_count: 8
source_plan_range: "408-415"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npx tsx --test --test-name-pattern "sprite bundle 048" tests/item-sprites.test.ts
  - "npm run test:unit exited 143 in current dirty workspace before a final summary"
items:
  - n: 408
    item_id: "void_archive_warrant"
    item_name_ru: "Пустотный архивный ордер"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 409
    item_id: "void_spike"
    item_name_ru: "Пустотный шип"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 410
    item_id: "voluntary_receipt"
    item_name_ru: "Расписка о добровольном участии"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 411
    item_id: "water"
    item_name_ru: "Вода"
    item_type: "DRINK"
    source_item_file: "src/data/items.ts"
    visual_kind: "drink"
    batch: "2_consumables_medicine"
  - n: 412
    item_id: "water_coupon"
    item_name_ru: "Талон на воду"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 413
    item_id: "water_filter_regulator"
    item_name_ru: "Регулятор фильтра воды"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "drink"
    batch: "2_consumables_medicine"
  - n: 414
    item_id: "water_reservoir_quota"
    item_name_ru: "Квота резервуара воды"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 415
    item_id: "water_reservoir_sample"
    item_name_ru: "Проба воды из резервуара"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "drink"
    batch: "2_consumables_medicine"
---

# Sprite Item Bundle 048: 408-415

## Status

Complete. Bundle 048 now has readable procedural sprites for all eight void, water and paperwork items. The shared world-drop texture hook and inventory/container icon paths derive the same visuals from `defId`; no imported assets, runtime dependencies or save payload sprite ids were added.

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

- Source item plans: 408-415.
- Item count: 8.
- Batches covered: `4_documents_access`, `5_samples_anomalies`, `6_misc_story_trade`, `2_consumables_medicine`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 408 | `void_archive_warrant` | Пустотный архивный ордер | `MISC` | document | 4_documents_access | src/data/items.ts |
| 409 | `void_spike` | Пустотный шип | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 410 | `voluntary_receipt` | Расписка о добровольном участии | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 411 | `water` | Вода | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 412 | `water_coupon` | Талон на воду | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 413 | `water_filter_regulator` | Регулятор фильтра воды | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |
| 414 | `water_reservoir_quota` | Квота резервуара воды | `MISC` | food | 2_consumables_medicine | src/data/documents_access.ts |
| 415 | `water_reservoir_sample` | Проба воды из резервуара | `MISC` | drink | 2_consumables_medicine | src/data/items.ts |

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

## Item 408: void_archive_warrant

Original metadata from deleted `sprite_item_408.md`:

- `status`: complete
- `item_id`: `void_archive_warrant`
- `item_name_ru`: Пустотный архивный ордер
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `void_archive_warrant` (`Пустотный архивный ордер`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `void_archive_warrant`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `void_archive_warrant`.
- Russian name: `Пустотный архивный ордер`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `120`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `document`, `evidence`, `void`, `warrant`.
- Description: Архивный ордер на нижние дела. Без подписи подозрителен, но редок.

### Sprite Requirements

- Visual kind: `document`.
- Gameplay read: document; make it visually separable from adjacent items in the same batch.
- Silhouette: карточка/талон/лист с черными строками и красной печатью.
- Material/palette: желтая бумага, черные строки, красная печать, серый край влаги.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: rare purple/blue glow; no full golden halo.
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

- [x] `void_archive_warrant` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `void_archive_warrant`, how it was inspected, and exact checks run.

---

## Item 409: void_spike

Original metadata from deleted `sprite_item_409.md`:

- `status`: complete
- `item_id`: `void_spike`
- `item_name_ru`: Пустотный шип
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: artifact/psi
- `batch`: 5_samples_anomalies
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `void_spike` (`Пустотный шип`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `void_spike`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `void_spike`.
- Russian name: `Пустотный шип`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `1500`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `evidence`, `psi`, `rare_trophy`, `void`.
- Description: Черный шип из нижнего маршрута. Носить отдельно от документов и еды.

### Sprite Requirements

- Visual kind: `artifact/psi`.
- Gameplay read: artifact/psi; make it visually separable from adjacent items in the same batch.
- Silhouette: невозможный бытовой предмет: бетон/эмаль плюс внутреннее свечение.
- Material/palette: фиолетово-синий glow, бетон/мясо/эмаль, редкий глазной мотив.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: rare purple/blue glow; no full golden halo.
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

- [x] `void_spike` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `artifact/psi` items.
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

Report changed files, visual rule chosen for `void_spike`, how it was inspected, and exact checks run.

---

## Item 410: voluntary_receipt

Original metadata from deleted `sprite_item_410.md`:

- `status`: complete
- `item_id`: `voluntary_receipt`
- `item_name_ru`: Расписка о добровольном участии
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: misc/story/trade
- `batch`: 6_misc_story_trade
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `voluntary_receipt` (`Расписка о добровольном участии`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `voluntary_receipt`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `voluntary_receipt`.
- Russian name: `Расписка о добровольном участии`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `14`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Добровольность проставлена печатью.

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

- [x] `voluntary_receipt` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `voluntary_receipt`, how it was inspected, and exact checks run.

---

## Item 411: water

Original metadata from deleted `sprite_item_411.md`:

- `status`: complete
- `item_id`: `water`
- `item_name_ru`: Вода
- `item_type`: `DRINK`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: drink
- `batch`: 2_consumables_medicine
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `water` (`Вода`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `water`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `water`.
- Russian name: `Вода`.
- Type: `DRINK`.
- Source file: `src/data/items.ts`.
- Value: `2`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: none.
- Description: Бутылка воды. Берите перед лифтом: без воды таблетки и бег быстро становятся хуже.

### Sprite Requirements

- Visual kind: `drink`.
- Gameplay read: drink; make it visually separable from adjacent items in the same batch.
- Silhouette: бутылка/канистра/банка с этикеткой и видимой жидкостью.
- Material/palette: мутное стекло или жестяная банка, циан/зеленый отблеск жидкости.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `water` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `drink` items.
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

Report changed files, visual rule chosen for `water`, how it was inspected, and exact checks run.

---

## Item 412: water_coupon

Original metadata from deleted `sprite_item_412.md`:

- `status`: complete
- `item_id`: `water_coupon`
- `item_name_ru`: Талон на воду
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `water_coupon` (`Талон на воду`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `water_coupon`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `water_coupon`.
- Russian name: `Талон на воду`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `2`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `coupon`, `document`, `economy`, `ration`.
- Description: Бумага на право одной бутылки. Используйте честно, украдите как улику или пустите в подделку.

### Sprite Requirements

- Visual kind: `food`.
- Gameplay read: food; make it visually separable from adjacent items in the same batch.
- Silhouette: брикет/банка/кусок органики; одна форма, один надрыв упаковки.
- Material/palette: охра, грязная бумага, тусклый зеленый/красный для концентратов и риска.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `water_coupon` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `food` items.
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

Report changed files, visual rule chosen for `water_coupon`, how it was inspected, and exact checks run.

---

## Item 413: water_filter_regulator

Original metadata from deleted `sprite_item_413.md`:

- `status`: complete
- `item_id`: `water_filter_regulator`
- `item_name_ru`: Регулятор фильтра воды
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: drink
- `batch`: 2_consumables_medicine
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `water_filter_regulator` (`Регулятор фильтра воды`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `water_filter_regulator`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `water_filter_regulator`.
- Russian name: `Регулятор фильтра воды`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `82`.
- Spawn weight: `0.3`.
- Stack max through `getStack()`: `3`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `filter`, `maintenance`, `production`, `regulator`, `repair`, `repair_input`, `tools`, `water`.
- Description: Ручка и мембрана для узла воды. Чинит выдачу фильтрованной воды; без паспорта насоса выглядит как кража из стояка.

### Sprite Requirements

- Visual kind: `drink`.
- Gameplay read: drink; make it visually separable from adjacent items in the same batch.
- Silhouette: бутылка/канистра/банка с этикеткой и видимой жидкостью.
- Material/palette: мутное стекло или жестяная банка, циан/зеленый отблеск жидкости.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `water_filter_regulator` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `drink` items.
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

Report changed files, visual rule chosen for `water_filter_regulator`, how it was inspected, and exact checks run.

---

## Item 414: water_reservoir_quota

Original metadata from deleted `sprite_item_414.md`:

- `status`: complete
- `item_id`: `water_reservoir_quota`
- `item_name_ru`: Квота резервуара воды
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `water_reservoir_quota` (`Квота резервуара воды`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `water_reservoir_quota`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `water_reservoir_quota`.
- Russian name: `Квота резервуара воды`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `34`.
- Spawn weight: `0.28`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `coupon`, `document`, `official`, `ration`, `single_use`, `water`.
- Description: Квота на малую выдачу воды. Бумага сухая, очередь мокрая.

### Sprite Requirements

- Visual kind: `food`.
- Gameplay read: food; make it visually separable from adjacent items in the same batch.
- Silhouette: брикет/банка/кусок органики; одна форма, один надрыв упаковки.
- Material/palette: охра, грязная бумага, тусклый зеленый/красный для концентратов и риска.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `water_reservoir_quota` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `food` items.
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

Report changed files, visual rule chosen for `water_reservoir_quota`, how it was inspected, and exact checks run.

---

## Item 415: water_reservoir_sample

Original metadata from deleted `sprite_item_415.md`:

- `status`: complete
- `item_id`: `water_reservoir_sample`
- `item_name_ru`: Проба воды из резервуара
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: drink
- `batch`: 2_consumables_medicine
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. This item now has a dedicated procedural sprite routed through the existing `defId` item-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `water_reservoir_sample` (`Проба воды из резервуара`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `water_reservoir_sample`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `water_reservoir_sample`.
- Russian name: `Проба воды из резервуара`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `38`.
- Spawn weight: `0.45`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `evidence`, `reservoir`, `sample`, `water`.
- Description: Мутная бутылка из суточного бака. Для НИИ это вода, для жильцов — вопрос, почему талон пахнет металлом.

### Sprite Requirements

- Visual kind: `drink`.
- Gameplay read: drink; make it visually separable from adjacent items in the same batch.
- Silhouette: бутылка/канистра/банка с этикеткой и видимой жидкостью.
- Material/palette: мутное стекло или жестяная банка, циан/зеленый отблеск жидкости.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `water_reservoir_sample` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `drink` items.
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

Report changed files, visual rule chosen for `water_reservoir_sample`, how it was inspected, and exact checks run.
