---
kind: sprite_item_bundle
status: planned
bundle: 24
source_plan_count: 9
source_plan_range: "208-216"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 208
    item_id: "liquidator_ration"
    item_name_ru: "Черный сухпай ликвидатора"
    item_type: "FOOD"
    source_item_file: "src/data/items.ts"
    visual_kind: "food"
    batch: "2_consumables_medicine"
  - n: 209
    item_id: "liquidator_token"
    item_name_ru: "Жетон ликвидатора"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 210
    item_id: "losyash_rifle"
    item_name_ru: "Винтовка Лосяша"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 211
    item_id: "machinegun"
    item_name_ru: "Пулемёт"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 212
    item_id: "magazine_part"
    item_name_ru: "Детали магазина"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "repair/material"
    batch: "3_tools_repair_cleanup"
  - n: 213
    item_id: "mail_intercept_slip"
    item_name_ru: "Лист перехвата почты"
    item_type: "MISC"
    source_item_file: "src/data/documents_access.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 214
    item_id: "makarov"
    item_name_ru: "Макаров"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 215
    item_id: "manometer"
    item_name_ru: "Манометр"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "tool"
    batch: "3_tools_repair_cleanup"
  - n: 216
    item_id: "market_weight_scale"
    item_name_ru: "Рыночные весы"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
---

# Sprite Item Bundle 024: 208-216

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

- Source item plans: 208-216.
- Item count: 9.
- Batches covered: `2_consumables_medicine`, `6_misc_story_trade`, `1_weapons_ammo`, `3_tools_repair_cleanup`, `4_documents_access`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 208 | `liquidator_ration` | Черный сухпай ликвидатора | `FOOD` | food | 2_consumables_medicine | src/data/items.ts |
| 209 | `liquidator_token` | Жетон ликвидатора | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 210 | `losyash_rifle` | Винтовка Лосяша | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 211 | `machinegun` | Пулемёт | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 212 | `magazine_part` | Детали магазина | `MISC` | repair/material | 3_tools_repair_cleanup | src/data/items.ts |
| 213 | `mail_intercept_slip` | Лист перехвата почты | `MISC` | document | 4_documents_access | src/data/documents_access.ts |
| 214 | `makarov` | Макаров | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 215 | `manometer` | Манометр | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 216 | `market_weight_scale` | Рыночные весы | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |

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

## Item 208: liquidator_ration

Original metadata from deleted `sprite_item_208.md`:

- `status`: planned
- `item_id`: `liquidator_ration`
- `item_name_ru`: Черный сухпай ликвидатора
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

Create a distinct procedural sprite/icon for `liquidator_ration` (`Черный сухпай ликвидатора`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `liquidator_ration`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `liquidator_ration`.
- Russian name: `Черный сухпай ликвидатора`.
- Type: `FOOD`.
- Source file: `src/data/items.ts`.
- Value: `15`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `bait`, `bait_meat`, `black_concentrate`, `closed_issue`, `concentrate`, `field_ration`, `liquidator`, `nutritious_concentrate`.
- Description: Питательный черняк закрытой выдачи: малый кусок держит смену, а вкус напоминает, кому его обычно дают.

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

- [ ] `liquidator_ration` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `liquidator_ration`, how it was inspected, and exact checks run.

---

## Item 209: liquidator_token

Original metadata from deleted `sprite_item_209.md`:

- `status`: planned
- `item_id`: `liquidator_token`
- `item_name_ru`: Жетон ликвидатора
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

Create a distinct procedural sprite/icon for `liquidator_token` (`Жетон ликвидатора`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `liquidator_token`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `liquidator_token`.
- Russian name: `Жетон ликвидатора`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `80`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Служебный жетон с номером отряда. На посту его узнают быстрее фамилии.

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

- [ ] `liquidator_token` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `liquidator_token`, how it was inspected, and exact checks run.

---

## Item 210: losyash_rifle

Original metadata from deleted `sprite_item_210.md`:

- `status`: planned
- `item_id`: `losyash_rifle`
- `item_name_ru`: Винтовка Лосяша
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

Create a distinct procedural sprite/icon for `losyash_rifle` (`Винтовка Лосяша`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `losyash_rifle`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `losyash_rifle`.
- Russian name: `Винтовка Лосяша`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `250`.
- Spawn weight: `0.025`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `anti_elite`, `deep_recon_stash`, `liquidator`, `precision`, `rifle`, `rifle_bolt_pack`, `weapon`.
- Description: Глубинная болтовая винтовка разведки. Урон 118. Один полимерный болт против элиты: выстрели, спрячь или сбереги.

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

- [ ] `losyash_rifle` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `losyash_rifle`, how it was inspected, and exact checks run.

---

## Item 211: machinegun

Original metadata from deleted `sprite_item_211.md`:

- `status`: planned
- `item_id`: `machinegun`
- `item_name_ru`: Пулемёт
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

Create a distinct procedural sprite/icon for `machinegun` (`Пулемёт`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `machinegun`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `machinegun`.
- Russian name: `Пулемёт`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `3400`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: ПКМ. Урон 10. Самый злой расход, широкий разброс. Ленточное питание

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

- [ ] `machinegun` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `machinegun`, how it was inspected, and exact checks run.

---

## Item 212: magazine_part

Original metadata from deleted `sprite_item_212.md`:

- `status`: planned
- `item_id`: `magazine_part`
- `item_name_ru`: Детали магазина
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

Create a distinct procedural sprite/icon for `magazine_part` (`Детали магазина`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `magazine_part`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `magazine_part`.
- Russian name: `Детали магазина`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `64`.
- Spawn weight: `0.55`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `armory_bench`, `magazine`, `metal`, `production`, `repair_input`, `trade`, `weapon_component`, `weapon_part`.
- Description: Пружина, губки и корпус пустого магазина. Сдай домкому за патроны, укради для оружейки или оставь на сборку ЧИЖ-3.

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

- [ ] `magazine_part` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `magazine_part`, how it was inspected, and exact checks run.

---

## Item 213: mail_intercept_slip

Original metadata from deleted `sprite_item_213.md`:

- `status`: planned
- `item_id`: `mail_intercept_slip`
- `item_name_ru`: Лист перехвата почты
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

Create a distinct procedural sprite/icon for `mail_intercept_slip` (`Лист перехвата почты`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/documents_access.ts` and any system that references `mail_intercept_slip`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `mail_intercept_slip`.
- Russian name: `Лист перехвата почты`.
- Type: `MISC`.
- Source file: `src/data/documents_access.ts`.
- Value: `46`.
- Spawn weight: `0.3`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `contraband`, `document`, `evidence`, `mail`, `stolen`.
- Description: Почтовый лист с чужим маршрутом. Можно вернуть, украсть дальше или продать адрес.

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

- [ ] `mail_intercept_slip` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `mail_intercept_slip`, how it was inspected, and exact checks run.

---

## Item 214: makarov

Original metadata from deleted `sprite_item_214.md`:

- `status`: planned
- `item_id`: `makarov`
- `item_name_ru`: Макаров
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

Create a distinct procedural sprite/icon for `makarov` (`Макаров`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `makarov`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `makarov`.
- Russian name: `Макаров`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `180`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Пистолет ПМ. Урон 16. Точный дешёвый выстрел, не очередь. Патроны 9мм

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

- [ ] `makarov` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `makarov`, how it was inspected, and exact checks run.

---

## Item 215: manometer

Original metadata from deleted `sprite_item_215.md`:

- `status`: planned
- `item_id`: `manometer`
- `item_name_ru`: Манометр
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: tool
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `manometer` (`Манометр`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `manometer`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `manometer`.
- Russian name: `Манометр`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `35`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `heatline`, `pressure`, `tool`.
- Description: Стрелка показывает давление и настроение труб. На Теплотрассе Ноль делает ремонт точным, но сам не тратится.

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

- [ ] `manometer` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `manometer`, how it was inspected, and exact checks run.

---

## Item 216: market_weight_scale

Original metadata from deleted `sprite_item_216.md`:

- `status`: planned
- `item_id`: `market_weight_scale`
- `item_name_ru`: Рыночные весы
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

Create a distinct procedural sprite/icon for `market_weight_scale` (`Рыночные весы`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `market_weight_scale`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `market_weight_scale`.
- Russian name: `Рыночные весы`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `88`.
- Spawn weight: `0.28`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `market`, `resident_good`, `trade`.
- Description: Малые весы с чужими гирями. Торговец ими доказывает вес, покупатель - обман.

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

- [ ] `market_weight_scale` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `market_weight_scale`, how it was inspected, and exact checks run.
