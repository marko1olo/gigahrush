---
kind: sprite_item_bundle
status: complete
bundle: 22
source_plan_count: 9
source_plan_range: "190-198"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 190
    item_id: "karkarov_pistol"
    item_name_ru: "Пистолет Каркарова"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 191
    item_id: "kasha"
    item_name_ru: "Каша"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 192
    item_id: "key"
    item_name_ru: "Ключ"
    item_type: "KEY"
    source_item_file: "src/data/items.ts"
    visual_kind: "key"
    batch: "4_documents_access"
  - n: 193
    item_id: "keyboard_unit"
    item_name_ru: "Клавиатура"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "electronics"
    batch: "3_tools_repair_cleanup"
  - n: 194
    item_id: "knife"
    item_name_ru: "Нож"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 195
    item_id: "kompot"
    item_name_ru: "Компот"
    item_type: "DRINK"
    source_item_file: "src/data/items.ts"
    visual_kind: "drink"
    batch: "2_consumables_medicine"
  - n: 196
    item_id: "krona_battery"
    item_name_ru: "Батарейка «Крона»"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "electronics"
    batch: "3_tools_repair_cleanup"
  - n: 197
    item_id: "kulich"
    item_name_ru: "Кулич"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 198
    item_id: "labor_shift_card"
    item_name_ru: "Карта смены"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "document"
    batch: "4_documents_access"
---

# Sprite Item Bundle 022: 190-198

## Status

Complete. All nine bundle items now resolve to distinct procedural sprites derived from `defId`; the generic world-drop texture hook and shared inventory/container icon renderer use the same visuals.

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

- Source item plans: 190-198.
- Item count: 9.
- Batches covered: `1_weapons_ammo`, `2_consumables_medicine`, `4_documents_access`, `3_tools_repair_cleanup`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 190 | `karkarov_pistol` | Пистолет Каркарова | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 191 | `kasha` | Каша | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 192 | `key` | Ключ | `KEY` | key | 4_documents_access | src/data/items.ts |
| 193 | `keyboard_unit` | Клавиатура | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 194 | `knife` | Нож | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 195 | `kompot` | Компот | `DRINK` | drink | 2_consumables_medicine | src/data/items.ts |
| 196 | `krona_battery` | Батарейка «Крона» | `MISC` | electronics | 3_tools_repair_cleanup | src/data/items.ts |
| 197 | `kulich` | Кулич | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 198 | `labor_shift_card` | Карта смены | `MISC` | document | 4_documents_access | src/data/documents_access.ts |

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

Validation note: `npm run typecheck` passed, and the focused bundle 022 sprite test passed after the final sprite state. A full `npm run test:unit` run completed but failed on an in-flight bundle 022 keyboard assertion and an unrelated pre-existing bundle 030 `plastic_sheet` sprite assertion; the fresh focused bundle 022 rerun clears the bundle 022 side.

# Included Item Plans

## Item 190: karkarov_pistol

Original metadata from deleted `sprite_item_190.md`:

- `status`: complete
- `item_id`: `karkarov_pistol`
- `item_name_ru`: Пистолет Каркарова
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `karkarov_pistol` uses a compact black-blue sidearm sprite with yellow service paint; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `karkarov_pistol` (`Пистолет Каркарова`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `karkarov_pistol`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `karkarov_pistol`.
- Russian name: `Пистолет Каркарова`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `150`.
- Spawn weight: `0.28`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `legal`, `liquidator`, `permit`, `short_sidearm`, `sidearm`, `weapon`, `weapon_permit`.
- Description: Слабый уставной пистолет. Урон 14. Дешевле ПМ, быстрее достаётся через ликвидаторский шкаф. 9мм.

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

- [x] `karkarov_pistol` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `karkarov_pistol`, how it was inspected, and exact checks run.

---

## Item 191: kasha

Original metadata from deleted `sprite_item_191.md`:

- `status`: complete
- `item_id`: `kasha`
- `item_name_ru`: Каша
- `item_type`: `FOOD`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `kasha` uses an ochre porridge bowl sprite with a grey communal bowl and spoon; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `kasha` (`Каша`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `kasha`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `kasha`.
- Russian name: `Каша`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `5`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `bait`, `bait_starch`, `bait_wet`.
- Description: Холодная казённая каша. Ложка стоит в ней по уставу.

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

- [x] `kasha` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `kasha`, how it was inspected, and exact checks run.

---

## Item 192: key

Original metadata from deleted `sprite_item_192.md`:

- `status`: complete
- `item_id`: `key`
- `item_name_ru`: Ключ
- `item_type`: `KEY`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: key
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `key` uses a brass key sprite with a readable ring hole, long shaft, teeth, tag and dirt marks; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `key` (`Ключ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `key`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `key`.
- Russian name: `Ключ`.
- Type: `KEY`.
- Source file: `src/data/items.ts`.
- Value: `50`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Подходит к конкретной двери. Сверяйте дверь, прежде чем бежать к ней на сирене

### Sprite Requirements

- Visual kind: `key`.
- Gameplay read: key; make it visually separable from adjacent items in the same batch.
- Silhouette: латунный ключ или бирка доступа, читаемый зубец.
- Material/palette: латунь, темная скважина, стертая бирка.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `key` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `key` items.
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

Report changed files, visual rule chosen for `key`, how it was inspected, and exact checks run.

---

## Item 193: keyboard_unit

Original metadata from deleted `sprite_item_193.md`:

- `status`: complete
- `item_id`: `keyboard_unit`
- `item_name_ru`: Клавиатура
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: electronics
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `keyboard_unit` uses a worn pale terminal keyboard sprite with dark key rows and cyan dead pixels; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `keyboard_unit` (`Клавиатура`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `keyboard_unit`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `keyboard_unit`.
- Russian name: `Клавиатура`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `32`.
- Spawn weight: `0.6`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `electronics`, `repair`, `terminal`.
- Description: Блок клавиш от терминала. Половина букв стерта, зато E ещё нажимается.

### Sprite Requirements

- Visual kind: `electronics`.
- Gameplay read: electronics; make it visually separable from adjacent items in the same batch.
- Silhouette: плата/радио/лампа: прямоугольный корпус, контакты, циановые пиксели.
- Material/palette: черный бакелит, белый корпус, циановые dead pixels, красный error slit.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: weak cyan/electric glow.
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

- [x] `keyboard_unit` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `electronics` items.
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

Report changed files, visual rule chosen for `keyboard_unit`, how it was inspected, and exact checks run.

---

## Item 194: knife

Original metadata from deleted `sprite_item_194.md`:

- `status`: complete
- `item_id`: `knife`
- `item_name_ru`: Нож
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `knife` uses a separate kitchen-knife sprite with pale blade, worn brown handle and rust marks; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `knife` (`Нож`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `knife`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `knife`.
- Russian name: `Нож`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `15`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Кухонный нож из общей кухни. Урон 7. Самый быстрый аварийный бой. Прочность 32

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

- [x] `knife` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `knife`, how it was inspected, and exact checks run.

---

## Item 195: kompot

Original metadata from deleted `sprite_item_195.md`:

- `status`: complete
- `item_id`: `kompot`
- `item_name_ru`: Компот
- `item_type`: `DRINK`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: drink
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `kompot` uses a cloudy red drink bottle sprite with translucent glass and cap marks; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `kompot` (`Компот`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `kompot`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `kompot`.
- Russian name: `Компот`.
- Type: `DRINK`.
- Source file: `src/data/items.ts`.
- Value: `5`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: none.
- Description: Мутный столовский компот. Хороший запас воды перед короткой вылазкой.

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

- [x] `kompot` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `kompot`, how it was inspected, and exact checks run.

---

## Item 196: krona_battery

Original metadata from deleted `sprite_item_196.md`:

- `status`: complete
- `item_id`: `krona_battery`
- `item_name_ru`: Батарейка «Крона»
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: electronics
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `krona_battery` uses a dark rectangular 9V battery sprite with brass contacts and cyan power ticks; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `krona_battery` (`Батарейка «Крона»`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `krona_battery`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `krona_battery`.
- Russian name: `Батарейка «Крона»`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `18`.
- Spawn weight: `0.8`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `battery`, `electronics`, `portable_power`, `tool_power`, `trade`.
- Description: Плоская батарейка для приборов, фонарей и тихих сделок с электриком. Сберечь для инструмента или продать как дефицит питания.

### Sprite Requirements

- Visual kind: `electronics`.
- Gameplay read: electronics; make it visually separable from adjacent items in the same batch.
- Silhouette: плата/радио/лампа: прямоугольный корпус, контакты, циановые пиксели.
- Material/palette: черный бакелит, белый корпус, циановые dead pixels, красный error slit.
- Procedural marks: noise, chipped edge, damp stain, rust, stamp, seam, slime film or dead pixels as appropriate; keep details readable at small size.
- Glow: weak cyan/electric glow.
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

- [x] `krona_battery` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `electronics` items.
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

Report changed files, visual rule chosen for `krona_battery`, how it was inspected, and exact checks run.

---

## Item 197: kulich

Original metadata from deleted `sprite_item_197.md`:

- `status`: complete
- `item_id`: `kulich`
- `item_name_ru`: Кулич
- `item_type`: `FOOD`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `kulich` uses a brown cake sprite with pale icing and red cross/sprinkle marks; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `kulich` (`Кулич`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `kulich`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `kulich`.
- Russian name: `Кулич`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `40`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: none.
- Description: Пасхальный кулич из храмовой кухни. Сытно, сладко, подозрительно светло.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `2_consumables_medicine`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `kulich` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `kulich`, how it was inspected, and exact checks run.

---

## Item 198: labor_shift_card

Original metadata from deleted `sprite_item_198.md`:

- `status`: complete
- `item_id`: `labor_shift_card`
- `item_name_ru`: Карта смены
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. `labor_shift_card` uses a yellowed production access card sprite with red official stamp and green shift strip; item drops and inventory/container grids use the same renderer path.

### Goal

Create a distinct procedural sprite/icon for `labor_shift_card` (`Карта смены`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `labor_shift_card`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `labor_shift_card`.
- Russian name: `Карта смены`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `24`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `access`, `document`, `document_gate`, `labor`, `official`, `permit`, `production`.
- Description: Рабочая карта со строкой цеха. Можно предъявить у поста N3, сберечь для проходной смены или продать рынку.

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

- [x] `labor_shift_card` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `labor_shift_card`, how it was inspected, and exact checks run.
