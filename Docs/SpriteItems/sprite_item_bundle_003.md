---
kind: sprite_item_bundle
status: implemented
bundle: 3
source_plan_count: 9
source_plan_range: "019-027"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 19
    item_id: "ammo_issue_order"
    item_name_ru: "Ордер на выдачу патронов"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 20
    item_id: "ammo_nagant"
    item_name_ru: "Патроны Наган"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 21
    item_id: "ammo_nails"
    item_name_ru: "Гвозди"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 22
    item_id: "ammo_rifle_coupon"
    item_name_ru: "Талон на винтовочные патроны"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 23
    item_id: "ammo_shells"
    item_name_ru: "Дробь"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 24
    item_id: "anti_spore_inhaler"
    item_name_ru: "Противоспоровый ингалятор"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
  - n: 25
    item_id: "antibiotic"
    item_name_ru: "Антибиотик"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
  - n: 26
    item_id: "antidep"
    item_name_ru: "Антидепрессант"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
  - n: 27
    item_id: "antiemetic"
    item_name_ru: "Противорвотное"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
---

# Sprite Item Bundle 003: 019-027

## Status

Implemented through the procedural item sprite generator and the existing generic item-drop/inventory/container icon paths. The bundle replaces the deleted single-item plan files for the item numbers above.

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

- Source item plans: 019-027.
- Item count: 9.
- Batches covered: `1_weapons_ammo`, `2_consumables_medicine`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 19 | `ammo_issue_order` | Ордер на выдачу патронов | `MISC` | ammo | 1_weapons_ammo | src/data/items.ts |
| 20 | `ammo_nagant` | Патроны Наган | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 21 | `ammo_nails` | Гвозди | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 22 | `ammo_rifle_coupon` | Талон на винтовочные патроны | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 23 | `ammo_shells` | Дробь | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 24 | `anti_spore_inhaler` | Противоспоровый ингалятор | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 25 | `antibiotic` | Антибиотик | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 26 | `antidep` | Антидепрессант | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 27 | `antiemetic` | Противорвотное | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |

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

### Bundle Completion Notes

- `ammo_issue_order`: damp paper cartridge issue voucher with red/green marks.
- `ammo_nagant`: old revolver cartridge cluster with brass/dark casing contrast.
- `ammo_nails`: taped industrial nail bundle for nail-gun ammunition.
- `ammo_rifle_coupon`: rifle cartridge issue coupon with long cartridges and official marks.
- `ammo_shells`: dark red shotgun shell tray.
- `anti_spore_inhaler`: worn respiratory inhaler with dose window and medical mark.
- `antibiotic`: dirty medical blister packet with capsule shapes.
- `antidep`: psi-medicine blister card with muted medical coding.
- `antiemetic`: small dirty anti-nausea packet with red/green medical cues.
- Validation passed: `npm run typecheck`, `npm exec tsx -- --test tests/item-sprites.test.ts tests/items_076_ammo_rifle_coupon.test.ts`, `npm run test:unit`.

# Included Item Plans

## Item 019: ammo_issue_order

Original metadata from deleted `sprite_item_019.md`:

- `status`: planned
- `item_id`: `ammo_issue_order`
- `item_name_ru`: Ордер на выдачу патронов
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the ammo-coupon/order procedural sprite branch. The item resolves to a damp cartridge issue voucher with paper body, red/green marks, and ammo-family cues in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ammo_issue_order` (`Ордер на выдачу патронов`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_issue_order`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_issue_order`.
- Russian name: `Ордер на выдачу патронов`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `72`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `ammo`, `document`, `single_use`, `weapon_permit`.
- Description: Одноразовый ордер на десять патронов 9мм. После погашения остается только запись в шкафу.

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

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ammo_issue_order` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_issue_order`, how it was inspected, and exact checks run.

---

## Item 020: ammo_nagant

Original metadata from deleted `sprite_item_020.md`:

- `status`: planned
- `item_id`: `ammo_nagant`
- `item_name_ru`: Патроны Наган
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the ammo procedural sprite branch. The item resolves to a compact old revolver cartridge cluster with brass/dark casing contrast in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ammo_nagant` (`Патроны Наган`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_nagant`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_nagant`.
- Russian name: `Патроны Наган`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `12`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Старые револьверные патроны

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

- [x] `ammo_nagant` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_nagant`, how it was inspected, and exact checks run.

---

## Item 021: ammo_nails

Original metadata from deleted `sprite_item_021.md`:

- `status`: planned
- `item_id`: `ammo_nails`
- `item_name_ru`: Гвозди
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the ammo procedural sprite branch. The item resolves to a taped industrial nail bundle with metal shafts and dirty tape in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ammo_nails` (`Гвозди`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_nails`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_nails`.
- Russian name: `Гвозди`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `9`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Промышленные гвозди для гвоздомёта

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

- [x] `ammo_nails` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_nails`, how it was inspected, and exact checks run.

---

## Item 022: ammo_rifle_coupon

Original metadata from deleted `sprite_item_022.md`:

- `status`: implemented
- `item_id`: `ammo_rifle_coupon`
- `item_name_ru`: Талон на винтовочные патроны
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the generic ammo-coupon procedural sprite branch. The item now resolves to a paper issue coupon with long rifle cartridges and colored issue/stamp marks in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ammo_rifle_coupon` (`Талон на винтовочные патроны`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `ammo_rifle_coupon`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_rifle_coupon`.
- Russian name: `Талон на винтовочные патроны`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `96`.
- Spawn weight: `0.18`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `ammo_762`, `coupon`, `document`, `liquidator`, `official`, `rifle`, `single_use`, `weapon_permit`.
- Description: Закрытая бумага на малую выдачу 7.62. Погасить на шесть патронов или беречь для оружейного окна.

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

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `1_weapons_ammo`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `ammo_rifle_coupon` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_rifle_coupon`, how it was inspected, and exact checks run.

---

## Item 023: ammo_shells

Original metadata from deleted `sprite_item_023.md`:

- `status`: planned
- `item_id`: `ammo_shells`
- `item_name_ru`: Дробь
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the ammo procedural sprite branch. The item resolves to a dark red shotgun shell tray with brass caps and dirty case wear in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `ammo_shells` (`Дробь`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_shells`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_shells`.
- Russian name: `Дробь`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `12`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Дробовые патроны для коридорных стволов

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

- [x] `ammo_shells` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_shells`, how it was inspected, and exact checks run.

---

## Item 024: anti_spore_inhaler

Original metadata from deleted `sprite_item_024.md`:

- `status`: planned
- `item_id`: `anti_spore_inhaler`
- `item_name_ru`: Противоспоровый ингалятор
- `item_type`: `MEDICINE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: medicine
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the medicine procedural sprite branch. The item resolves to a worn respiratory inhaler with nozzle, dose window, and medical mark in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `anti_spore_inhaler` (`Противоспоровый ингалятор`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `anti_spore_inhaler`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `anti_spore_inhaler`.
- Russian name: `Противоспоровый ингалятор`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `85`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `medicine`, `respiratory`, `spore_counterplay`.
- Description: Разовый баллончик для мокрых коридоров и грибной пыли. Не делает воздух чистым, только даёт выйти из него живым.

### Sprite Requirements

- Visual kind: `medicine`.
- Gameplay read: medicine; make it visually separable from adjacent items in the same batch.
- Silhouette: аптечный пакет, ампула, бинт или ингалятор с красным/зеленым медицинским знаком.
- Material/palette: грязно-белый, аптечный красный, зеленоватое стекло, стерильный но изношенный вид.
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

- [x] `anti_spore_inhaler` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `medicine` items.
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

Report changed files, visual rule chosen for `anti_spore_inhaler`, how it was inspected, and exact checks run.

---

## Item 025: antibiotic

Original metadata from deleted `sprite_item_025.md`:

- `status`: planned
- `item_id`: `antibiotic`
- `item_name_ru`: Антибиотик
- `item_type`: `MEDICINE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: medicine
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the medicine procedural sprite branch. The item resolves to a dirty medical blister packet with red mark and green capsule shapes in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `antibiotic` (`Антибиотик`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `antibiotic`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `antibiotic`.
- Russian name: `Антибиотик`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `70`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `antibiotic`, `medicine`, `triage`.
- Description: Таблетки против обычной грязи. В карантине это не лечение, а выбор очереди.

### Sprite Requirements

- Visual kind: `medicine`.
- Gameplay read: medicine; make it visually separable from adjacent items in the same batch.
- Silhouette: аптечный пакет, ампула, бинт или ингалятор с красным/зеленым медицинским знаком.
- Material/palette: грязно-белый, аптечный красный, зеленоватое стекло, стерильный но изношенный вид.
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

- [x] `antibiotic` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `medicine` items.
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

Report changed files, visual rule chosen for `antibiotic`, how it was inspected, and exact checks run.

---

## Item 026: antidep

Original metadata from deleted `sprite_item_026.md`:

- `status`: planned
- `item_id`: `antidep`
- `item_name_ru`: Антидепрессант
- `item_type`: `MEDICINE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: medicine
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the medicine procedural sprite branch. The item resolves to a worn psi-medicine blister card with muted medical coding in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `antidep` (`Антидепрессант`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `antidep`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `antidep`.
- Russian name: `Антидепрессант`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `95`.
- Spawn weight: `0.7`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `medicine`, `psi_restore`, `rare`.
- Description: Редкая таблетка после ПСИ-срывов и плохих вылазок. +12 ПСИ, HP не лечит.

### Sprite Requirements

- Visual kind: `medicine`.
- Gameplay read: medicine; make it visually separable from adjacent items in the same batch.
- Silhouette: аптечный пакет, ампула, бинт или ингалятор с красным/зеленым медицинским знаком.
- Material/palette: грязно-белый, аптечный красный, зеленоватое стекло, стерильный но изношенный вид.
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

- [x] `antidep` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `medicine` items.
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

Report changed files, visual rule chosen for `antidep`, how it was inspected, and exact checks run.

---

## Item 027: antiemetic

Original metadata from deleted `sprite_item_027.md`:

- `status`: planned
- `item_id`: `antiemetic`
- `item_name_ru`: Противорвотное
- `item_type`: `MEDICINE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: medicine
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Implemented through the medicine procedural sprite branch. The item resolves to a dirty anti-nausea packet with red and green medical cues in world drops and inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `antiemetic` (`Противорвотное`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `antiemetic`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `antiemetic`.
- Russian name: `Противорвотное`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `24`.
- Spawn weight: `0.75`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `food_safety`, `medicine`, `nausea`.
- Description: Малая таблетка после плохой еды, лифта и запаха сырого мяса. Спасает ужин ценой аптечного запаса.

### Sprite Requirements

- Visual kind: `medicine`.
- Gameplay read: medicine; make it visually separable from adjacent items in the same batch.
- Silhouette: аптечный пакет, ампула, бинт или ингалятор с красным/зеленым медицинским знаком.
- Material/palette: грязно-белый, аптечный красный, зеленоватое стекло, стерильный но изношенный вид.
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

- [x] `antiemetic` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `medicine` items.
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

Report changed files, visual rule chosen for `antiemetic`, how it was inspected, and exact checks run.
