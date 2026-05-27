---
kind: sprite_item_bundle
status: planned
bundle: 12
source_plan_count: 9
source_plan_range: "100-108"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 100
    item_id: "cracked_sample_jar"
    item_name_ru: "Треснувшая банка для пробы"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 101
    item_id: "crowbar"
    item_name_ru: "Лом"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 102
    item_id: "cult_supply_list"
    item_name_ru: "Кухонный список ячейки"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 103
    item_id: "deactivated_residue"
    item_name_ru: "Гашёный остаток"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 104
    item_id: "debt_settlement_receipt"
    item_name_ru: "Квитанция о погашении"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 105
    item_id: "decon_completion_stamp"
    item_name_ru: "Штамп санобработки"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 106
    item_id: "decon_fluid"
    item_name_ru: "Обеззараживающая жидкость"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 107
    item_id: "denunciation"
    item_name_ru: "Донос"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 108
    item_id: "dice_bone"
    item_name_ru: "Игральные кости"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
---

# Sprite Item Bundle 012: 100-108

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

- Source item plans: 100-108.
- Item count: 9.
- Batches covered: `5_samples_anomalies`, `1_weapons_ammo`, `6_misc_story_trade`, `4_documents_access`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 100 | `cracked_sample_jar` | Треснувшая банка для пробы | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 101 | `crowbar` | Лом | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 102 | `cult_supply_list` | Кухонный список ячейки | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 103 | `deactivated_residue` | Гашёный остаток | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 104 | `debt_settlement_receipt` | Квитанция о погашении | `MISC` | document | 4_documents_access | src/data/items.ts |
| 105 | `decon_completion_stamp` | Штамп санобработки | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 106 | `decon_fluid` | Обеззараживающая жидкость | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 107 | `denunciation` | Донос | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 108 | `dice_bone` | Игральные кости | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |

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

## Item 100: cracked_sample_jar

Original metadata from deleted `sprite_item_100.md`:

- `status`: planned
- `item_id`: `cracked_sample_jar`
- `item_name_ru`: Треснувшая банка для пробы
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

Create a distinct procedural sprite/icon for `cracked_sample_jar` (`Треснувшая банка для пробы`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `cracked_sample_jar`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `cracked_sample_jar`.
- Russian name: `Треснувшая банка для пробы`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `3`.
- Spawn weight: `0.5`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `aftermath`, `container`, `contaminant`, `damaged`, `sampleware`, `trade`.
- Description: Стекло держится на честном слове и старом скотче. Образец в ней дешевеет ещё до сдачи.

### Sprite Requirements

- Visual kind: `sample/anomaly`.
- Gameplay read: sample/anomaly; make it visually separable from adjacent items in the same batch.
- Silhouette: банка/ампула с веществом; если опасно - глазоподобный пузырь внутри.
- Material/palette: стекло/банка, слизь, фиолетовый/кислотно-зеленый/синий glow по tags.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `cracked_sample_jar` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `cracked_sample_jar`, how it was inspected, and exact checks run.

---

## Item 101: crowbar

Original metadata from deleted `sprite_item_101.md`:

- `status`: planned
- `item_id`: `crowbar`
- `item_name_ru`: Лом
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

Create a distinct procedural sprite/icon for `crowbar` (`Лом`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `crowbar`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `crowbar`.
- Russian name: `Лом`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `100`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Тяжёлый лом. Урон 24. Средняя дистанция, высокая прочность 120

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

- [ ] `crowbar` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `crowbar`, how it was inspected, and exact checks run.

---

## Item 102: cult_supply_list

Original metadata from deleted `sprite_item_102.md`:

- `status`: planned
- `item_id`: `cult_supply_list`
- `item_name_ru`: Кухонный список ячейки
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

Create a distinct procedural sprite/icon for `cult_supply_list` (`Кухонный список ячейки`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `cult_supply_list`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `cult_supply_list`.
- Russian name: `Кухонный список ячейки`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `38`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Хлеб, ключи, фамилии и стрелки к чужим кастрюлям. Доказательство пахнет кипятком.

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

- [ ] `cult_supply_list` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `cult_supply_list`, how it was inspected, and exact checks run.

---

## Item 103: deactivated_residue

Original metadata from deleted `sprite_item_103.md`:

- `status`: planned
- `item_id`: `deactivated_residue`
- `item_name_ru`: Гашёный остаток
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

Create a distinct procedural sprite/icon for `deactivated_residue` (`Гашёный остаток`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `deactivated_residue`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `deactivated_residue`.
- Russian name: `Гашёный остаток`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `55`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `burned`, `deactivated`, `reagent`, `sample`, `slime`.
- Description: Серый сухой осадок после печи или кипятка. Уже не тянется к пальцам, но акт всё равно нужен.

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

- [ ] `deactivated_residue` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `deactivated_residue`, how it was inspected, and exact checks run.

---

## Item 104: debt_settlement_receipt

Original metadata from deleted `sprite_item_104.md`:

- `status`: planned
- `item_id`: `debt_settlement_receipt`
- `item_name_ru`: Квитанция о погашении
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `debt_settlement_receipt` (`Квитанция о погашении`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `debt_settlement_receipt`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `debt_settlement_receipt`.
- Russian name: `Квитанция о погашении`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `110`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `access`, `banking`, `debt`, `document`, `official`, `receipt`.
- Description: Банк признает, что долг закрыт. Остальные признают только пока печать сухая.

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

- [ ] `debt_settlement_receipt` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `document` items.
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

Report changed files, visual rule chosen for `debt_settlement_receipt`, how it was inspected, and exact checks run.

---

## Item 105: decon_completion_stamp

Original metadata from deleted `sprite_item_105.md`:

- `status`: planned
- `item_id`: `decon_completion_stamp`
- `item_name_ru`: Штамп санобработки
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `decon_completion_stamp` (`Штамп санобработки`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `decon_completion_stamp`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `decon_completion_stamp`.
- Russian name: `Штамп санобработки`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `55`.
- Spawn weight: `0.32`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `cleanup`, `decon`, `document`, `liquidator`, `maintenance`, `official`, `stamp`, `trade`.
- Description: Мокрая отметка о зачистке. Пол может быть грязным, но журнал уже успокоился; рынок берет ее как доказательство санобработки.

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

- [ ] `decon_completion_stamp` still exists in `ITEMS`.
- [ ] Russian name/description are not translated or accidentally changed.
- [ ] Sprite is distinct from other `document` items.
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

Report changed files, visual rule chosen for `decon_completion_stamp`, how it was inspected, and exact checks run.

---

## Item 106: decon_fluid

Original metadata from deleted `sprite_item_106.md`:

- `status`: planned
- `item_id`: `decon_fluid`
- `item_name_ru`: Обеззараживающая жидкость
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

Create a distinct procedural sprite/icon for `decon_fluid` (`Обеззараживающая жидкость`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `decon_fluid`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `decon_fluid`.
- Russian name: `Обеззараживающая жидкость`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `75`.
- Spawn weight: `0.45`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `cleanup`, `counterplay`, `decon`, `fungus`, `liquidator`, `reagent`, `slime`.
- Description: Щёлочная жидкость для пола, перчаток и плохих решений. Ликвидаторы ценят целую канистру выше рассказа.

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

- [ ] `decon_fluid` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `decon_fluid`, how it was inspected, and exact checks run.

---

## Item 107: denunciation

Original metadata from deleted `sprite_item_107.md`:

- `status`: planned
- `item_id`: `denunciation`
- `item_name_ru`: Донос
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

Create a distinct procedural sprite/icon for `denunciation` (`Донос`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `denunciation`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `denunciation`.
- Russian name: `Донос`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `12`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Подписан чужой рукой слишком уверенно.

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

- [ ] `denunciation` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `denunciation`, how it was inspected, and exact checks run.

---

## Item 108: dice_bone

Original metadata from deleted `sprite_item_108.md`:

- `status`: planned
- `item_id`: `dice_bone`
- `item_name_ru`: Игральные кости
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

Create a distinct procedural sprite/icon for `dice_bone` (`Игральные кости`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `dice_bone`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `dice_bone`.
- Russian name: `Игральные кости`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `16`.
- Spawn weight: `0.65`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `gambling`, `resident_good`, `trade`.
- Description: Пара костей с разными углами честности. У автомата звенят громче талона.

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

- [ ] `dice_bone` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `dice_bone`, how it was inspected, and exact checks run.
