---
kind: sprite_item_bundle
status: complete
bundle: 35
source_plan_count: 8
source_plan_range: "304-311"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 304
    item_id: "rail_spike_pack"
    item_name_ru: "Пакет костылей"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "repair/material"
    batch: "3_tools_repair_cleanup"
  - n: 305
    item_id: "rail_switch_handle"
    item_name_ru: "Рукоять стрелочного перевода"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "repair/material"
    batch: "3_tools_repair_cleanup"
  - n: 306
    item_id: "rail_switch_order"
    item_name_ru: "Ордер стрелочного перевода"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 307
    item_id: "raionsovet_floor_pass"
    item_name_ru: "Пропуск райсовета"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 308
    item_id: "rake_bayonet"
    item_name_ru: "Штык-грабли"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 309
    item_id: "ration_registry_extract"
    item_name_ru: "Выписка из пайкового реестра"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 310
    item_id: "ration_stamp_pad"
    item_name_ru: "Пайковая штемпельная подушка"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 311
    item_id: "rawmeat"
    item_name_ru: "Сырое мясо"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
---

# Sprite Item Bundle 035: 304-311

## Status

Complete. The bundle items now have distinct procedural sprites covered by item-sprite regression tests.

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

- Source item plans: 304-311.
- Item count: 8.
- Batches covered: `3_tools_repair_cleanup`, `4_documents_access`, `1_weapons_ammo`, `2_consumables_medicine`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 304 | `rail_spike_pack` | Пакет костылей | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 305 | `rail_switch_handle` | Рукоять стрелочного перевода | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 306 | `rail_switch_order` | Ордер стрелочного перевода | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 307 | `raionsovet_floor_pass` | Пропуск райсовета | `MISC` | document | 4_documents_access | src/data/items.ts |
| 308 | `rake_bayonet` | Штык-грабли | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 309 | `ration_registry_extract` | Выписка из пайкового реестра | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 310 | `ration_stamp_pad` | Пайковая штемпельная подушка | `MISC` | food | 2_consumables_medicine | src/data/items.ts |
| 311 | `rawmeat` | Сырое мясо | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |

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

## Item 304: rail_spike_pack

Original metadata from deleted `sprite_item_304.md`:

- `status`: planned
- `item_id`: `rail_spike_pack`
- `item_name_ru`: Пакет костылей
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: repair/material
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `rail_spike_pack` (`Пакет костылей`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `rail_spike_pack`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `rail_spike_pack`.
- Russian name: `Пакет костылей`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `34`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `metal`, `rail`, `repair`, `transport`.
- Description: Рельсовые костыли в промасленной бумаге. Материал скучный, пока путь не уходит под мясо.

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

- [ ] `rail_spike_pack` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `rail_spike_pack`, how it was inspected, and exact checks run.

---

## Item 305: rail_switch_handle

Original metadata from deleted `sprite_item_305.md`:

- `status`: planned
- `item_id`: `rail_switch_handle`
- `item_name_ru`: Рукоять стрелочного перевода
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: repair/material
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `rail_switch_handle` (`Рукоять стрелочного перевода`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `rail_switch_handle`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `rail_switch_handle`.
- Russian name: `Рукоять стрелочного перевода`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `120`.
- Spawn weight: `0.2`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `metal`, `rail`, `repair`, `transport`.
- Description: Рычаг депо с жёлтой краской. Без будки управления это просто тяжёлая причина спорить о маршруте.

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

- [ ] `rail_switch_handle` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `rail_switch_handle`, how it was inspected, and exact checks run.

---

## Item 306: rail_switch_order

Original metadata from deleted `sprite_item_306.md`:

- `status`: planned
- `item_id`: `rail_switch_order`
- `item_name_ru`: Ордер стрелочного перевода
- `item_type`: `MISC`
- `source_item_file`: `src/data/documents_access.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `rail_switch_order` (`Ордер стрелочного перевода`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `rail_switch_order`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `rail_switch_order`.
- Russian name: `Ордер стрелочного перевода`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `110`.
- Spawn weight: `0.12`.
- Stack max through `getStack()`: `2`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `access`, `document`, `document_gate`, `official`, `order`, `rail`, `route_permit`, `transport`.
- Description: Приказ на перевод стрелки. Его можно предъявить у поста, продать рынку или сберечь до будки управления.

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

- [ ] `rail_switch_order` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `rail_switch_order`, how it was inspected, and exact checks run.

---

## Item 307: raionsovet_floor_pass

Original metadata from deleted `sprite_item_307.md`:

- `status`: planned
- `item_id`: `raionsovet_floor_pass`
- `item_name_ru`: Пропуск райсовета
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `raionsovet_floor_pass` (`Пропуск райсовета`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `raionsovet_floor_pass`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `raionsovet_floor_pass`.
- Russian name: `Пропуск райсовета`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `95`.
- Spawn weight: `0.8`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `access`, `archive`, `document`, `document_gate`, `official`, `permit`, `raionsovet`.
- Description: Служебный пропуск к архивным полкам райсовета. Работает тише, если не спрашивать, кто его подписал.

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

- [ ] `raionsovet_floor_pass` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `raionsovet_floor_pass`, how it was inspected, and exact checks run.

---

## Item 308: rake_bayonet

Original metadata from deleted `sprite_item_308.md`:

- `status`: planned
- `item_id`: `rake_bayonet`
- `item_name_ru`: Штык-грабли
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `rake_bayonet` (`Штык-грабли`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `rake_bayonet`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `rake_bayonet`.
- Russian name: `Штык-грабли`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `240`.
- Spawn weight: `0.18`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `bayonet`, `issue_gear`, `liquidator`, `melee_reach`, `metal`, `rake`, `rare_stash`, `weapon`.
- Description: Узкий штык с зубьями на конце. Урон 14. Быстрый дальний укол из редкого шкафа зачистки: украсть, сдать как металл или оставить для дистанции.

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

- [ ] `rake_bayonet` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `rake_bayonet`, how it was inspected, and exact checks run.

---

## Item 309: ration_registry_extract

Original metadata from deleted `sprite_item_309.md`:

- `status`: planned
- `item_id`: `ration_registry_extract`
- `item_name_ru`: Выписка из пайкового реестра
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `ration_registry_extract` (`Выписка из пайкового реестра`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ration_registry_extract`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ration_registry_extract`.
- Russian name: `Выписка из пайкового реестра`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `26`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `audit`, `document`, `ration`, `registry`.
- Description: Документ доказывает право на лишнюю ложку. С поддельной карточкой становится доносом.

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

- [ ] `ration_registry_extract` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ration_registry_extract`, how it was inspected, and exact checks run.

---

## Item 310: ration_stamp_pad

Original metadata from deleted `sprite_item_310.md`:

- `status`: planned
- `item_id`: `ration_stamp_pad`
- `item_name_ru`: Пайковая штемпельная подушка
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `ration_stamp_pad` (`Пайковая штемпельная подушка`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `ration_stamp_pad`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `ration_stamp_pad`.
- Russian name: `Пайковая штемпельная подушка`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `24`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `document`, `forgery`, `ration`, `stamp`.
- Description: Краска пахнет очередью. Используйте с бланком, выпиской или талоном, чтобы сделать опасную подделку.

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

- [ ] `ration_stamp_pad` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `ration_stamp_pad`, how it was inspected, and exact checks run.

---

## Item 311: rawmeat

Original metadata from deleted `sprite_item_311.md`:

- `status`: planned
- `item_id`: `rawmeat`
- `item_name_ru`: Сырое мясо
- `item_type`: `FOOD`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: food
- `batch`: 2_consumables_medicine
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete in bundle 035. The sprite is implemented and visible through world-drop and inventory/container icon paths.

### Goal

Create a distinct procedural sprite/icon for `rawmeat` (`Сырое мясо`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `rawmeat`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `rawmeat`.
- Russian name: `Сырое мясо`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `1`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `bait`, `bait_meat`, `bait_risky`, `bait_trap`.
- Description: Подозрительный кусок без протокола происхождения. Насыщает слабо, но годится как мясная приманка.

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

- [ ] `rawmeat` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `rawmeat`, how it was inspected, and exact checks run.
