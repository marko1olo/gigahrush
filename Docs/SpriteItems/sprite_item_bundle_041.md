---
kind: sprite_item_bundle
status: planned
bundle: 41
source_plan_count: 8
source_plan_range: "352-359"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 352
    item_id: "siren_shard"
    item_name_ru: "Осколок сирены"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "artifact/psi"
    batch: "5_samples_anomalies"
  - n: 353
    item_id: "sledgehammer"
    item_name_ru: "Кувалда"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 354
    item_id: "sleeping_pills"
    item_name_ru: "Снотворное «Попобава»"
    item_type: "MEDICINE"
    source_item_file: "src/data/items.ts"
    visual_kind: "medicine"
    batch: "2_consumables_medicine"
  - n: 355
    item_id: "slime_age_label_brown"
    item_name_ru: "Бирка молодой слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 356
    item_id: "slime_age_label_orange"
    item_name_ru: "Бирка подростковой слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 357
    item_id: "slime_age_label_violet"
    item_name_ru: "Бирка взрослой слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 358
    item_id: "slime_calcified_chip"
    item_name_ru: "Окаменевший скол слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
  - n: 359
    item_id: "slime_motor_node"
    item_name_ru: "Моторный узел слизи"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "sample/anomaly"
    batch: "5_samples_anomalies"
---

# Sprite Item Bundle 041: 352-359

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

- Source item plans: 352-359.
- Item count: 8.
- Batches covered: `5_samples_anomalies`, `1_weapons_ammo`, `2_consumables_medicine`, `4_documents_access`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 352 | `siren_shard` | Осколок сирены | `MISC` | artifact/psi | 5_samples_anomalies | src/data/items.ts |
| 353 | `sledgehammer` | Кувалда | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 354 | `sleeping_pills` | Снотворное «Попобава» | `MEDICINE` | medicine | 2_consumables_medicine | src/data/items.ts |
| 355 | `slime_age_label_brown` | Бирка молодой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 356 | `slime_age_label_orange` | Бирка подростковой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 357 | `slime_age_label_violet` | Бирка взрослой слизи | `MISC` | document | 4_documents_access | src/data/items.ts |
| 358 | `slime_calcified_chip` | Окаменевший скол слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |
| 359 | `slime_motor_node` | Моторный узел слизи | `MISC` | sample/anomaly | 5_samples_anomalies | src/data/items.ts |

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

## Item 352: siren_shard

Original metadata from deleted `sprite_item_352.md`:

- `status`: planned
- `item_id`: `siren_shard`
- `item_name_ru`: Осколок сирены
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: artifact/psi
- `batch`: 5_samples_anomalies
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Planned for a future parallel GPT-5.5 worker. Do not mark complete until the sprite is implemented, visible in world drops and visible in inventory/container grids.

### Goal

Create a distinct procedural sprite/icon for `siren_shard` (`Осколок сирены`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `siren_shard`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `siren_shard`.
- Russian name: `Осколок сирены`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `90`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `evidence`, `psi`, `rare_trophy`, `samosbor`.
- Description: Кусок красного пластика после тревоги. НИИ и ликвидаторы берут как улику Самосбора.

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

- Expected reachability: generic loot via spawnRooms/spawnW.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `5_samples_anomalies`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `siren_shard` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `siren_shard`, how it was inspected, and exact checks run.

---

## Item 353: sledgehammer

Original metadata from deleted `sprite_item_353.md`:

- `status`: planned
- `item_id`: `sledgehammer`
- `item_name_ru`: Кувалда
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

Create a distinct procedural sprite/icon for `sledgehammer` (`Кувалда`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `sledgehammer`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `sledgehammer`.
- Russian name: `Кувалда`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `260`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: none.
- Description: Медленная кувалда. Урон 52. Большой замах, большой стоп. Прочность 85

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

- [ ] `sledgehammer` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `sledgehammer`, how it was inspected, and exact checks run.

---

## Item 354: sleeping_pills

Original metadata from deleted `sprite_item_354.md`:

- `status`: planned
- `item_id`: `sleeping_pills`
- `item_name_ru`: Снотворное «Попобава»
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

Create a distinct procedural sprite/icon for `sleeping_pills` (`Снотворное «Попобава»`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `sleeping_pills`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `sleeping_pills`.
- Russian name: `Снотворное «Попобава»`.
- Type: `MEDICINE`.
- Source file: `src/data/items.ts`.
- Value: `62`.
- Spawn weight: `0.35`.
- Stack max through `getStack()`: `999`.
- Equip slot: `none`.
- Has use action: `yes`.
- Tags: `black_market`, `controlled`, `forced_rest`, `medicine`, `risk`, `sleep`.
- Description: Малый блистер для принудительного сна после смены, погони или чужого рецепта. Сон приходит сразу; вода, еда и осторожность уходят первыми.

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

- [ ] `sleeping_pills` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `sleeping_pills`, how it was inspected, and exact checks run.

---

## Item 355: slime_age_label_brown

Original metadata from deleted `sprite_item_355.md`:

- `status`: planned
- `item_id`: `slime_age_label_brown`
- `item_name_ru`: Бирка молодой слизи
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

Create a distinct procedural sprite/icon for `slime_age_label_brown` (`Бирка молодой слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `slime_age_label_brown`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `slime_age_label_brown`.
- Russian name: `Бирка молодой слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `22`.
- Spawn weight: `0.32`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `age_label`, `brown_slime`, `document`, `evidence`, `slime`.
- Description: Коричневая бирка первичного налёта. Доказательство дешёвое, зато жильцы верят ему быстрее, чем лекции НИИ.

### Sprite Requirements

- Visual kind: `document`.
- Gameplay read: document; make it visually separable from adjacent items in the same batch.
- Silhouette: карточка/талон/лист с черными строками и красной печатью.
- Material/palette: желтая бумага, черные строки, красная печать, серый край влаги.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `slime_age_label_brown` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `slime_age_label_brown`, how it was inspected, and exact checks run.

---

## Item 356: slime_age_label_orange

Original metadata from deleted `sprite_item_356.md`:

- `status`: planned
- `item_id`: `slime_age_label_orange`
- `item_name_ru`: Бирка подростковой слизи
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

Create a distinct procedural sprite/icon for `slime_age_label_orange` (`Бирка подростковой слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `slime_age_label_orange`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `slime_age_label_orange`.
- Russian name: `Бирка подростковой слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `52`.
- Spawn weight: `0.2`.
- Stack max through `getStack()`: `8`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `age_label`, `audit`, `cleanup`, `document`, `evidence`, `nii`, `orange_slime`, `slime`.
- Description: Оранжевая метка трёхдневной слизи: ожог, волдыри, акт и просьба не идти босиком.

### Sprite Requirements

- Visual kind: `document`.
- Gameplay read: document; make it visually separable from adjacent items in the same batch.
- Silhouette: карточка/талон/лист с черными строками и красной печатью.
- Material/palette: желтая бумага, черные строки, красная печать, серый край влаги.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `slime_age_label_orange` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `slime_age_label_orange`, how it was inspected, and exact checks run.

---

## Item 357: slime_age_label_violet

Original metadata from deleted `sprite_item_357.md`:

- `status`: planned
- `item_id`: `slime_age_label_violet`
- `item_name_ru`: Бирка взрослой слизи
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

Create a distinct procedural sprite/icon for `slime_age_label_violet` (`Бирка взрослой слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `slime_age_label_violet`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `slime_age_label_violet`.
- Russian name: `Бирка взрослой слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `130`.
- Spawn weight: `0.08`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `age_label`, `document`, `evidence`, `slime`, `violet_slime`.
- Description: Тёмно-фиолетовая бирка взрослого остатка. Такая метка стоит дорого, потому что рядом с ней обычно уже ползут стены.

### Sprite Requirements

- Visual kind: `document`.
- Gameplay read: document; make it visually separable from adjacent items in the same batch.
- Silhouette: карточка/талон/лист с черными строками и красной печатью.
- Material/palette: желтая бумага, черные строки, красная печать, серый край влаги.
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

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [ ] `slime_age_label_violet` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `slime_age_label_violet`, how it was inspected, and exact checks run.

---

## Item 358: slime_calcified_chip

Original metadata from deleted `sprite_item_358.md`:

- `status`: planned
- `item_id`: `slime_calcified_chip`
- `item_name_ru`: Окаменевший скол слизи
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

Create a distinct procedural sprite/icon for `slime_calcified_chip` (`Окаменевший скол слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `slime_calcified_chip`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `slime_calcified_chip`.
- Russian name: `Окаменевший скол слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `78`.
- Spawn weight: `0.18`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `aftermath`, `calcified`, `factory_input`, `nii`, `reagent`, `sample`, `slime`.
- Description: Твёрдый кусок умершей слизи. Его можно сдать как зрелый образец, пустить в печь или оставить техникам как проклятый минерал.

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

- [ ] `slime_calcified_chip` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `slime_calcified_chip`, how it was inspected, and exact checks run.

---

## Item 359: slime_motor_node

Original metadata from deleted `sprite_item_359.md`:

- `status`: planned
- `item_id`: `slime_motor_node`
- `item_name_ru`: Моторный узел слизи
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

Create a distinct procedural sprite/icon for `slime_motor_node` (`Моторный узел слизи`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `slime_motor_node`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `slime_motor_node`.
- Russian name: `Моторный узел слизи`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `190`.
- Spawn weight: `0.08`.
- Stack max through `getStack()`: `3`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `aftermath`, `evidence`, `legal_handoff`, `movement`, `nii`, `organ`, `sample`, `slime`, `trade`.
- Description: Малый дрожащий узел из слизи, которая слишком хорошо помнила движение. НИИ платит, если донести без разреза; рынок платит, если не спрашивать, почему он дёргается.

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

- [ ] `slime_motor_node` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `slime_motor_node`, how it was inspected, and exact checks run.
