---
kind: sprite_item_bundle
status: complete
bundle: 2
source_plan_count: 9
source_plan_range: "010-018"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 10
    item_id: "ammo_762"
    item_name_ru: "Патроны 7.62"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 11
    item_id: "ammo_762tt"
    item_name_ru: "Патроны 7.62 ТТ"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 12
    item_id: "ammo_9mm"
    item_name_ru: "Патроны 9мм"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 13
    item_id: "ammo_belt"
    item_name_ru: "Лента 7.62"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 14
    item_id: "ammo_coupon_9mm"
    item_name_ru: "Талон на 9мм"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 15
    item_id: "ammo_coupon_shells"
    item_name_ru: "Талон на дробь"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 16
    item_id: "ammo_energy"
    item_name_ru: "Энергоячейка"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 17
    item_id: "ammo_fuel"
    item_name_ru: "Канистра бензина"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
  - n: 18
    item_id: "ammo_harpoon"
    item_name_ru: "Гарпуны"
    item_type: "AMMO"
    source_item_file: "src/data/items.ts"
    visual_kind: "ammo"
    batch: "1_weapons_ammo"
---

# Sprite Item Bundle 002: 010-018

## Status

Complete. Bundle 002 now has readable procedural sprites for all nine ammo and ammo-paper items. The shared world-drop texture hook and inventory/container icon paths derive the same visuals from `defId`; no imported assets, runtime dependencies or save payload sprite ids were added.

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

- Source item plans: 010-018.
- Item count: 9.
- Batches covered: `1_weapons_ammo`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 10 | `ammo_762` | Патроны 7.62 | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 11 | `ammo_762tt` | Патроны 7.62 ТТ | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 12 | `ammo_9mm` | Патроны 9мм | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 13 | `ammo_belt` | Лента 7.62 | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 14 | `ammo_coupon_9mm` | Талон на 9мм | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 15 | `ammo_coupon_shells` | Талон на дробь | `MISC` | ammo | 1_weapons_ammo | src/data/documents_access.ts |
| 16 | `ammo_energy` | Энергоячейка | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 17 | `ammo_fuel` | Канистра бензина | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |
| 18 | `ammo_harpoon` | Гарпуны | `AMMO` | ammo | 1_weapons_ammo | src/data/items.ts |

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

## Item 010: ammo_762

Original metadata from deleted `sprite_item_010.md`:

- `status`: complete
- `item_id`: `ammo_762`
- `item_name_ru`: Патроны 7.62
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_762` now has a procedural four-cartridge rifle-ammo sprite with brass bodies, dark case bases, red/green code bands, an orange packet stripe and grime/rust noise. The existing generic item-drop and inventory/container icon paths derive the same sprite from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_762` (`Патроны 7.62`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_762`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_762`.
- Russian name: `Патроны 7.62`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `18`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Редкие винтовочные патроны для Калашникова

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

- [x] `ammo_762` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_762`, how it was inspected, and exact checks run.

---

## Item 011: ammo_762tt

Original metadata from deleted `sprite_item_011.md`:

- `status`: complete
- `item_id`: `ammo_762tt`
- `item_name_ru`: Патроны 7.62 ТТ
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_762tt` now has a short TT pistol-cartridge sprite with a dark pocket/tray, brass bodies, black bullet tips, red caliber stripe, green packet mark and grime. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_762tt` (`Патроны 7.62 ТТ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_762tt`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_762tt`.
- Russian name: `Патроны 7.62 ТТ`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `10`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Пистолетные патроны для ТТ

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

- [x] `ammo_762tt` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_762tt`, how it was inspected, and exact checks run.

---

## Item 012: ammo_9mm

Original metadata from deleted `sprite_item_012.md`:

- `status`: complete
- `item_id`: `ammo_9mm`
- `item_name_ru`: Патроны 9мм
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_9mm` now has a dedicated procedural five-round cartridge sprite with brass bodies, dark tray/base marks, red and green caliber stripes, and grime noise. The existing generic item-drop and inventory/container icon paths derive the same sprite from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_9mm` (`Патроны 9мм`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_9mm`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_9mm`.
- Russian name: `Патроны 9мм`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `3`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Девятка для ПМ, самоделок и ППШ. Маленькая валюта оружейки и коридора

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

- [x] `ammo_9mm` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_9mm`, how it was inspected, and exact checks run.

---

## Item 013: ammo_belt

Original metadata from deleted `sprite_item_013.md`:

- `status`: complete
- `item_id`: `ammo_belt`
- `item_name_ru`: Лента 7.62
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_belt` now reads as a linked 7.62 feed belt with five brass cartridges, dark belt links, colored ammo-code stripes and dirty metal wear. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_belt` (`Лента 7.62`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_belt`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_belt`.
- Russian name: `Лента 7.62`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `140`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Пулемётная лента. Большой вес и большой расход

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

- [x] `ammo_belt` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_belt`, how it was inspected, and exact checks run.

---

## Item 014: ammo_coupon_9mm

Original metadata from deleted `sprite_item_014.md`:

- `status`: complete
- `item_id`: `ammo_coupon_9mm`
- `item_name_ru`: Талон на 9мм
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_coupon_9mm` now has an official 9mm voucher sprite with a chipped dirty-paper coupon backing, multiple brass 9mm cartridges, dark ink cuts and a green code strip/stamp. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_coupon_9mm` (`Талон на 9мм`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `ammo_coupon_9mm`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_coupon_9mm`.
- Russian name: `Талон на 9мм`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `45`.
- Spawn weight: `0.35`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `ammo`, `coupon`, `document`, `official`, `single_use`, `weapon_permit`.
- Description: Малый патронный талон. Гасится на десять девяток, если шкаф еще признает смену.

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

- [x] `ammo_coupon_9mm` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_coupon_9mm`, how it was inspected, and exact checks run.

---

## Item 015: ammo_coupon_shells

Original metadata from deleted `sprite_item_015.md`:

- `status`: complete
- `item_id`: `ammo_coupon_shells`
- `item_name_ru`: Талон на дробь
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_coupon_shells` now has an official shotgun paperwork sprite with dirty coupon backing, red shotgun code, vertical shell silhouettes, brass caps and pellet dots. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_coupon_shells` (`Талон на дробь`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `ammo_coupon_shells`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_coupon_shells`.
- Russian name: `Талон на дробь`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `62`.
- Spawn weight: `0.25`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `ammo`, `coupon`, `document`, `official`, `single_use`, `weapon_permit`.
- Description: Бумага на короткую пачку дроби. Для коридора полезнее жалобы.

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

- [x] `ammo_coupon_shells` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_coupon_shells`, how it was inspected, and exact checks run.

---

## Item 016: ammo_energy

Original metadata from deleted `sprite_item_016.md`:

- `status`: complete
- `item_id`: `ammo_energy`
- `item_name_ru`: Энергоячейка
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_energy` now has a charged energy-cell sprite with dark graphite housing, green charge core, brass contacts, red/orange code band and small charge sparks. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_energy` (`Энергоячейка`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_energy`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_energy`.
- Russian name: `Энергоячейка`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `260`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Редкая энергоячейка для плазмы, гаусса и БФГ

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

- [x] `ammo_energy` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_energy`, how it was inspected, and exact checks run.

---

## Item 017: ammo_fuel

Original metadata from deleted `sprite_item_017.md`:

- `status`: complete
- `item_id`: `ammo_fuel`
- `item_name_ru`: Канистра бензина
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: Codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_fuel` now has a dedicated procedural fuel-canister sprite derived from item `defId`, visible through the shared world-drop texture path and the inventory/container icon path.

### Goal

Create a distinct procedural sprite/icon for `ammo_fuel` (`Канистра бензина`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_fuel`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_fuel`.
- Russian name: `Канистра бензина`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `70`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Дефицитное топливо для огнемёта

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

- [x] `ammo_fuel` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_fuel`, how it was inspected, and exact checks run.

---

## Item 018: ammo_harpoon

Original metadata from deleted `sprite_item_018.md`:

- `status`: complete
- `item_id`: `ammo_harpoon`
- `item_name_ru`: Гарпуны
- `item_type`: `AMMO`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: ammo
- `batch`: 1_weapons_ammo
- `owner`: codex
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `ammo_harpoon` now has a long coded harpoon-bolt sprite with four dark shafts, pale barbed spear tips, brass collars, wet grime and red/green ammo-code bands. The shared world-drop and inventory/container paths derive the same icon from `defId`.

### Goal

Create a distinct procedural sprite/icon for `ammo_harpoon` (`Гарпуны`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ammo_harpoon`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ammo_harpoon`.
- Russian name: `Гарпуны`.
- Type: `AMMO`.
- Source file: `src/data/items.ts`.
- Value: `60`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Тяжелые редкие гарпуны для водных ходов

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

- [x] `ammo_harpoon` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ammo_harpoon`, how it was inspected, and exact checks run.
