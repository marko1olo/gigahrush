---
kind: sprite_item_bundle
status: complete
bundle: 9
source_plan_count: 9
source_plan_range: "073-081"
owner: codex
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 73
    item_id: "chernobog_liquidator_memo"
    item_name_ru: "Памятка ликвидатора ЧБ"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 74
    item_id: "chernobog_redacted_central_note"
    item_name_ru: "Редакция центральной записки"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 75
    item_id: "chernobog_witness_correction"
    item_name_ru: "Правка показаний ЧБ"
    item_type: "MISC"
    source_item_file: "src/data/chernobog_docket.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 76
    item_id: "chest_failsafe_charge"
    item_name_ru: "Фугасный нагрудный заряд"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 77
    item_id: "child_map"
    item_name_ru: "Карта детей"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 78
    item_id: "chizh3_shotgun"
    item_name_ru: "ЧИЖ-3"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 79
    item_id: "cigs"
    item_name_ru: "Сигареты"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 80
    item_id: "circuit_board"
    item_name_ru: "Микросхема"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "misc/story/trade"
    batch: "6_misc_story_trade"
  - n: 81
    item_id: "clean_health_cert"
    item_name_ru: "Справка об отсутствии заражения"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
---

# Sprite Item Bundle 009: 073-081

## Status

Complete. All nine items now resolve to distinct procedural sprites through the shared item sprite renderer, with validation passing `npm run typecheck` and `npm run test:unit`.

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

- Source item plans: 073-081.
- Item count: 9.
- Batches covered: `5_samples_anomalies`, `1_weapons_ammo`, `6_misc_story_trade`, `4_documents_access`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 73 | `chernobog_liquidator_memo` | Памятка ликвидатора ЧБ | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 74 | `chernobog_redacted_central_note` | Редакция центральной записки | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 75 | `chernobog_witness_correction` | Правка показаний ЧБ | `MISC` | artifact/psi | 5_samples_anomalies | src/data/chernobog_docket.ts |
| 76 | `chest_failsafe_charge` | Фугасный нагрудный заряд | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 77 | `child_map` | Карта детей | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 78 | `chizh3_shotgun` | ЧИЖ-3 | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 79 | `cigs` | Сигареты | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 80 | `circuit_board` | Микросхема | `MISC` | misc/story/trade | 6_misc_story_trade | src/data/items.ts |
| 81 | `clean_health_cert` | Справка об отсутствии заражения | `MISC` | document | 4_documents_access | src/data/items.ts |

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

## Item 073: chernobog_liquidator_memo

Original metadata from deleted `sprite_item_073.md`:

- `status`: planned
- `item_id`: `chernobog_liquidator_memo`
- `item_name_ru`: Памятка ликвидатора ЧБ
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

Create a distinct procedural sprite/icon for `chernobog_liquidator_memo` (`Памятка ликвидатора ЧБ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_liquidator_memo`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_liquidator_memo`.
- Russian name: `Памятка ликвидатора ЧБ`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `160`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Приказ различать культ, очередь и совпадение. Подписант оставил только номер.

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

- [ ] `chernobog_liquidator_memo` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `chernobog_liquidator_memo`, how it was inspected, and exact checks run.

---

## Item 074: chernobog_redacted_central_note

Original metadata from deleted `sprite_item_074.md`:

- `status`: planned
- `item_id`: `chernobog_redacted_central_note`
- `item_name_ru`: Редакция центральной записки
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

Create a distinct procedural sprite/icon for `chernobog_redacted_central_note` (`Редакция центральной записки`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_redacted_central_note`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_redacted_central_note`.
- Russian name: `Редакция центральной записки`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `240`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Черные прямоугольники держатся крепче печати. Видно: "центр", "внешние", "не подтверждать".

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

- [ ] `chernobog_redacted_central_note` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `chernobog_redacted_central_note`, how it was inspected, and exact checks run.

---

## Item 075: chernobog_witness_correction

Original metadata from deleted `sprite_item_075.md`:

- `status`: planned
- `item_id`: `chernobog_witness_correction`
- `item_name_ru`: Правка показаний ЧБ
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

Create a distinct procedural sprite/icon for `chernobog_witness_correction` (`Правка показаний ЧБ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/chernobog_docket.ts` and any system that references `chernobog_witness_correction`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chernobog_witness_correction`.
- Russian name: `Правка показаний ЧБ`.
- Type: `MISC`.
- Source file: `src/data/chernobog_docket.ts`.
- Value: `120`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `archive`, `chernobog`, `cult`, `evidence`, `witness`.
- Description: Форма заменяет "видел" на "предположил". Поле для дрожи не предусмотрено.

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

- [ ] `chernobog_witness_correction` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `chernobog_witness_correction`, how it was inspected, and exact checks run.

---

## Item 076: chest_failsafe_charge

Original metadata from deleted `sprite_item_076.md`:

- `status`: planned
- `item_id`: `chest_failsafe_charge`
- `item_name_ru`: Фугасный нагрудный заряд
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

Create a distinct procedural sprite/icon for `chest_failsafe_charge` (`Фугасный нагрудный заряд`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `chest_failsafe_charge`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chest_failsafe_charge`.
- Russian name: `Фугасный нагрудный заряд`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `1650`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `contraband`, `explosive`, `failsafe`, `grenade`, `liquidator`, `panic_clear`, `single_use`, `story_rare`, `weapon`.
- Description: Опломбированный аварийный фугас. Урон 175 по площади. Один рывок, один взрыв, один рапорт: украсть, продать или оставить на безвыходный коридор.

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

- [ ] `chest_failsafe_charge` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `chest_failsafe_charge`, how it was inspected, and exact checks run.

---

## Item 077: child_map

Original metadata from deleted `sprite_item_077.md`:

- `status`: planned
- `item_id`: `child_map`
- `item_name_ru`: Карта детей
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

Create a distinct procedural sprite/icon for `child_map` (`Карта детей`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `child_map`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `child_map`.
- Russian name: `Карта детей`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `30`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Карандашная карта двора и соседних комнат. Может вывести к тайнику или к чужой двери.

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

- [ ] `child_map` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `child_map`, how it was inspected, and exact checks run.

---

## Item 078: chizh3_shotgun

Original metadata from deleted `sprite_item_078.md`:

- `status`: planned
- `item_id`: `chizh3_shotgun`
- `item_name_ru`: ЧИЖ-3
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

Create a distinct procedural sprite/icon for `chizh3_shotgun` (`ЧИЖ-3`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `chizh3_shotgun`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `chizh3_shotgun`.
- Russian name: `ЧИЖ-3`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `980`.
- Spawn weight: `0.14`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `ammo_shells`, `corridor_stop`, `issue_stash`, `liquidator`, `permit`, `shotgun`, `weapon`.
- Description: Уставной помповый дробовик зачистки. Урон 10x8. Уже обреза, быстрее ТОЗа, требует дробь и право на шум.

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

- [ ] `chizh3_shotgun` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `chizh3_shotgun`, how it was inspected, and exact checks run.

---

## Item 079: cigs

Original metadata from deleted `sprite_item_079.md`:

- `status`: planned
- `item_id`: `cigs`
- `item_name_ru`: Сигареты
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

Create a distinct procedural sprite/icon for `cigs` (`Сигареты`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `cigs`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `cigs`.
- Russian name: `Сигареты`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `5`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Пачка «Прима». Курилка принимает её как пропуск без фотографии

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

- [ ] `cigs` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `cigs`, how it was inspected, and exact checks run.

---

## Item 080: circuit_board

Original metadata from deleted `sprite_item_080.md`:

- `status`: planned
- `item_id`: `circuit_board`
- `item_name_ru`: Микросхема
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

Create a distinct procedural sprite/icon for `circuit_board` (`Микросхема`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `circuit_board`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `circuit_board`.
- Russian name: `Микросхема`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `35`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Плата с дорожками и реле. Нужна для приборов, лифтовых обходов и ремонта.

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

- [ ] `circuit_board` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `circuit_board`, how it was inspected, and exact checks run.

---

## Item 081: clean_health_cert

Original metadata from deleted `sprite_item_081.md`:

- `status`: planned
- `item_id`: `clean_health_cert`
- `item_name_ru`: Справка об отсутствии заражения
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

Create a distinct procedural sprite/icon for `clean_health_cert` (`Справка об отсутствии заражения`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `clean_health_cert`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `clean_health_cert`.
- Russian name: `Справка об отсутствии заражения`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `35`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `document`, `quarantine`.
- Description: Медицинская справка с печатью. В карантинной очереди её смотрят до лица.

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

- [ ] `clean_health_cert` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `clean_health_cert`, how it was inspected, and exact checks run.
