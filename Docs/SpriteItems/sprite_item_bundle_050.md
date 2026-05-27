---
kind: sprite_item_bundle
status: planned
bundle: 50
source_plan_count: 8
source_plan_range: "424-431"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 424
    item_id: "zatychkin_pistol"
    item_name_ru: "Пистолет Затычкина"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 425
    item_id: "zhek_seal"
    item_name_ru: "Печать ЖЭК"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 426
    item_id: "zhelemish_boiled"
    item_name_ru: "Варёный желемыш"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
  - n: 427
    item_id: "zhelemish_dried"
    item_name_ru: "Сушёный желемыш"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 428
    item_id: "zhelemish_raw"
    item_name_ru: "Сырой желемыш"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 429
    item_id: "zhelemish_sample_contaminated"
    item_name_ru: "Загрязнённый образец желемыша"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 430
    item_id: "zhelemish_sample_sealed"
    item_name_ru: "Запечатанный образец желемыша"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 431
    item_id: "zinc_slime_bucket"
    item_name_ru: "Цинковое ведро для слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
---

# Sprite Item Bundle 050: 424-431

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

- Source item plans: 424-431.
- Item count: 8.
- Batches covered: `1_weapons_ammo`, `6_misc_story_trade`, `2_consumables_medicine`, `5_samples_anomalies`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 424 | `zatychkin_pistol` | Пистолет Затычкина | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 425 | `zhek_seal` | Печать ЖЭК | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 426 | `zhelemish_boiled` | Варёный желемыш | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 427 | `zhelemish_dried` | Сушёный желемыш | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 428 | `zhelemish_raw` | Сырой желемыш | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 429 | `zhelemish_sample_contaminated` | Загрязнённый образец желемыша | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 430 | `zhelemish_sample_sealed` | Запечатанный образец желемыша | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 431 | `zinc_slime_bucket` | Цинковое ведро для слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |

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

## Item 424: zatychkin_pistol

Original metadata from deleted `sprite_item_424.md`:

- `status`: planned
- `item_id`: `zatychkin_pistol`
- `item_name_ru`: Пистолет Затычкина
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

Create a distinct procedural sprite/icon for `zatychkin_pistol` (`Пистолет Затычкина`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zatychkin_pistol`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zatychkin_pistol`.
- Russian name: `Пистолет Затычкина`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `620`.
- Spawn weight: `0.12`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `ammo_9mm`, `burst`, `liquidator`, `officer`, `officer_stash`, `ovb`, `sidearm`, `weapon`.
- Description: Офицерская нервная скорострелка. Урон 13. Темп выше ПМ, разброс шире, 9мм уходят без доклада.

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

- [ ] `zatychkin_pistol` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `zatychkin_pistol`, how it was inspected, and exact checks run.

---

## Item 425: zhek_seal

Original metadata from deleted `sprite_item_425.md`:

- `status`: planned
- `item_id`: `zhek_seal`
- `item_name_ru`: Печать ЖЭК
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

Create a distinct procedural sprite/icon for `zhek_seal` (`Печать ЖЭК`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhek_seal`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhek_seal`.
- Russian name: `Печать ЖЭК`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `120`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Резиновая печать для актов, жалоб и мокрых справок.

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

- [ ] `zhek_seal` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `zhek_seal`, how it was inspected, and exact checks run.

---

## Item 426: zhelemish_boiled

Original metadata from deleted `sprite_item_426.md`:

- `status`: planned
- `item_id`: `zhelemish_boiled`
- `item_name_ru`: Варёный желемыш
- `item_type`: `MEDICINE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: medicine
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zhelemish_boiled` (`Варёный желемыш`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhelemish_boiled`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhelemish_boiled`.
- Russian name: `Варёный желемыш`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `16`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `skin_status`, `treated`, `zhelemish`.
- Description: Слизистая припарка после кипятка. Немного лечит и даёт дешёвую защиту кожи.

### Sprite Requirements

- Visual kind: `medicine`.
- Gameplay read: medicine; make it visually separable from adjacent items in the same batch.
- Silhouette: аптечный пакет, ампула, бинт или ингалятор с красным/зеленым медицинским знаком.
- Material/palette: грязно-белый, аптечный красный, зеленоватое стекло, стерильный но изношенный вид.
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

- [ ] `zhelemish_boiled` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `medicine` items.
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

Report changed files, visual rule chosen for `zhelemish_boiled`, how it was inspected, and exact checks run.

---

## Item 427: zhelemish_dried

Original metadata from deleted `sprite_item_427.md`:

- `status`: planned
- `item_id`: `zhelemish_dried`
- `item_name_ru`: Сушёный желемыш
- `item_type`: `FOOD`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zhelemish_dried` (`Сушёный желемыш`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhelemish_dried`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhelemish_dried`.
- Russian name: `Сушёный желемыш`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `11`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `bait`, `bait_fungal`, `skin_status`, `treated`, `zhelemish`.
- Description: Тёмная дублёная пластина из погреба. Безопаснее сырого и всё ещё годится как грибная приманка.

### Sprite Requirements

- Visual kind: `food`.
- Gameplay read: food; make it visually separable from adjacent items in the same batch.
- Silhouette: брикет/банка/кусок органики; одна форма, один надрыв упаковки.
- Material/palette: охра, грязная бумага, тусклый зеленый/красный для концентратов и риска.
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

- [ ] `zhelemish_dried` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `food` items.
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

Report changed files, visual rule chosen for `zhelemish_dried`, how it was inspected, and exact checks run.

---

## Item 428: zhelemish_raw

Original metadata from deleted `sprite_item_428.md`:

- `status`: planned
- `item_id`: `zhelemish_raw`
- `item_name_ru`: Сырой желемыш
- `item_type`: `FOOD`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zhelemish_raw` (`Сырой желемыш`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhelemish_raw`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhelemish_raw`.
- Russian name: `Сырой желемыш`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `5`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `bait`, `bait_fungal`, `bait_risky`, `raw`, `skin_status`, `zhelemish`.
- Description: Холодный комок погребной плесени. Даёт сытость, грубо дубит кожу и бьёт по HP.

### Sprite Requirements

- Visual kind: `food`.
- Gameplay read: food; make it visually separable from adjacent items in the same batch.
- Silhouette: брикет/банка/кусок органики; одна форма, один надрыв упаковки.
- Material/palette: охра, грязная бумага, тусклый зеленый/красный для концентратов и риска.
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

- [ ] `zhelemish_raw` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `food` items.
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

Report changed files, visual rule chosen for `zhelemish_raw`, how it was inspected, and exact checks run.

---

## Item 429: zhelemish_sample_contaminated

Original metadata from deleted `sprite_item_429.md`:

- `status`: planned
- `item_id`: `zhelemish_sample_contaminated`
- `item_name_ru`: Загрязнённый образец желемыша
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: sample/anomaly
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zhelemish_sample_contaminated` (`Загрязнённый образец желемыша`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhelemish_sample_contaminated`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhelemish_sample_contaminated`.
- Russian name: `Загрязнённый образец желемыша`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `18`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `contaminated`, `nii`, `sample`, `zhelemish`.
- Description: Открытый комок желемыша с чужой пылью, кожей и грибницей. Годится для слухов, но НИИ такой образец не примет.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `zhelemish_sample_contaminated` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `sample/anomaly` items.
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

Report changed files, visual rule chosen for `zhelemish_sample_contaminated`, how it was inspected, and exact checks run.

---

## Item 430: zhelemish_sample_sealed

Original metadata from deleted `sprite_item_430.md`:

- `status`: planned
- `item_id`: `zhelemish_sample_sealed`
- `item_name_ru`: Запечатанный образец желемыша
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: sample/anomaly
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zhelemish_sample_sealed` (`Запечатанный образец желемыша`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zhelemish_sample_sealed`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zhelemish_sample_sealed`.
- Russian name: `Запечатанный образец желемыша`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `240`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `nii`, `sample`, `sealed`, `zhelemish`.
- Description: Чистая проба желемыша в таре НИИ. Пломба важнее содержимого: без неё лаборатория видит только грязь и повод.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `zhelemish_sample_sealed` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `sample/anomaly` items.
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

Report changed files, visual rule chosen for `zhelemish_sample_sealed`, how it was inspected, and exact checks run.

---

## Item 431: zinc_slime_bucket

Original metadata from deleted `sprite_item_431.md`:

- `status`: planned
- `item_id`: `zinc_slime_bucket`
- `item_name_ru`: Цинковое ведро для слизи
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: sample/anomaly
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `zinc_slime_bucket` (`Цинковое ведро для слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `zinc_slime_bucket`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `zinc_slime_bucket`.
- Russian name: `Цинковое ведро для слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `210`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `cleanup`, `container`, `evidence`, `liquidator`, `samosbor`, `sample`, `slime`.
- Description: Тяжёлое ведро с пломбой зачистки. НИИ и ликвидаторы платят за полный акт; рынок платит за риск.

### Sprite Requirements

- Visual kind: `sample/anomaly`.
- Gameplay read: sample/anomaly; make it visually separable from adjacent items in the same batch.
- Silhouette: банка/ампула с веществом; если опасно - глазоподобный пузырь внутри.
- Material/palette: стекло/банка, слизь, фиолетовый/кислотно-зеленый/синий glow по tags.
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

- [ ] `zinc_slime_bucket` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `sample/anomaly` items.
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

Report changed files, visual rule chosen for `zinc_slime_bucket`, how it was inspected, and exact checks run.
