---
kind: sprite_item_bundle
status: complete
bundle: 27
source_plan_count: 9
source_plan_range: "235-243"
owner: unassigned
risk: mixed
validation:
  - npm run typecheck
  - npm run test:unit
items:
  - n: 235
    item_id: "nii_contraband_manifest"
    item_name_ru: "Ведомость утечки НИИ"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 236
    item_id: "nii_forged_audit"
    item_name_ru: "Подложный акт НИИ"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 237
    item_id: "nii_market_receipt"
    item_name_ru: "Рыночная расписка НИИ"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 238
    item_id: "nii_sample_container"
    item_name_ru: "Тара НИИ для пробы"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 239
    item_id: "nii_sample_label"
    item_name_ru: "Наклейка НИИ для пробы"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 240
    item_id: "noise_can"
    item_name_ru: "Шумовая банка"
    item_type: "MISC"
    source_item_file: "src/data/items.ts"
    visual_kind: "tool"
    batch: "3_tools_repair_cleanup"
  - n: 241
    item_id: "nosin_rifle"
    item_name_ru: "Винтовка Носина"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
  - n: 242
    item_id: "note"
    item_name_ru: "Записка"
    item_type: "NOTE"
    source_item_file: "src/data/items.ts"
    visual_kind: "document"
    batch: "4_documents_access"
  - n: 243
    item_id: "o15_multijet_flamer"
    item_name_ru: "6О15-УТТХ"
    item_type: "WEAPON"
    source_item_file: "src/data/items.ts"
    visual_kind: "weapon"
    batch: "1_weapons_ammo"
---

# Sprite Item Bundle 027: 235-243

## Status

Complete. All nine bundle items now resolve to distinct procedural sprites derived from `defId`; the generic world-drop texture hook and shared inventory/container icon renderer use the same visuals.

Validation note: `npm run typecheck` and the focused bundle 027 item sprite test pass. The full unit sweep invoked as `npm run test:unit -- tests/item-sprites.test.ts` currently stops on existing bundle 029 sprite assertions for `party_portrait_pin` and `permanganate_vial`; bundle 027 passed inside that run before the unrelated failure summary.

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

- Source item plans: 235-243.
- Item count: 9.
- Batches covered: `4_documents_access`, `3_tools_repair_cleanup`, `1_weapons_ammo`.

## Included Items

| N | item_id | Russian name | Type | Visual need | Batch | Source |
| ---: | --- | --- | --- | --- | --- | --- |
| 235 | `nii_contraband_manifest` | Ведомость утечки НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 236 | `nii_forged_audit` | Подложный акт НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 237 | `nii_market_receipt` | Рыночная расписка НИИ | `MISC` | document | 4_documents_access | src/data/items.ts |
| 238 | `nii_sample_container` | Тара НИИ для пробы | `MISC` | document | 4_documents_access | src/data/items.ts |
| 239 | `nii_sample_label` | Наклейка НИИ для пробы | `MISC` | document | 4_documents_access | src/data/items.ts |
| 240 | `noise_can` | Шумовая банка | `MISC` | tool | 3_tools_repair_cleanup | src/data/items.ts |
| 241 | `nosin_rifle` | Винтовка Носина | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |
| 242 | `note` | Записка | `NOTE` | document | 4_documents_access | src/data/items.ts |
| 243 | `o15_multijet_flamer` | 6О15-УТТХ | `WEAPON` | weapon | 1_weapons_ammo | src/data/items.ts |

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

## Item 235: nii_contraband_manifest

Original metadata from deleted `sprite_item_235.md`:

- `status`: planned
- `item_id`: `nii_contraband_manifest`
- `item_name_ru`: Ведомость утечки НИИ
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nii_contraband_manifest` (`Ведомость утечки НИИ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nii_contraband_manifest`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nii_contraband_manifest`.
- Russian name: `Ведомость утечки НИИ`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `140`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `audit`, `contraband`, `document`, `evidence`, `nii`.
- Description: Акт ревизии: опечатанные пробы вышли из НИИ как списанная тара и всплыли у рыночных посредников.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `nii_contraband_manifest` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nii_contraband_manifest`, how it was inspected, and exact checks run.

---

## Item 236: nii_forged_audit

Original metadata from deleted `sprite_item_236.md`:

- `status`: planned
- `item_id`: `nii_forged_audit`
- `item_name_ru`: Подложный акт НИИ
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nii_forged_audit` (`Подложный акт НИИ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nii_forged_audit`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nii_forged_audit`.
- Russian name: `Подложный акт НИИ`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `110`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `audit`, `contraband`, `document`, `forgery`, `nii`.
- Description: Акт списания, где заражённая проба стала пустой ампулой, а пустая ампула стала премией.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `nii_forged_audit` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nii_forged_audit`, how it was inspected, and exact checks run.

---

## Item 237: nii_market_receipt

Original metadata from deleted `sprite_item_237.md`:

- `status`: planned
- `item_id`: `nii_market_receipt`
- `item_name_ru`: Рыночная расписка НИИ
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nii_market_receipt` (`Рыночная расписка НИИ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nii_market_receipt`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nii_market_receipt`.
- Russian name: `Рыночная расписка НИИ`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `95`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `black_market`, `contraband`, `evidence`, `nii`, `receipt`.
- Description: Неровная расписка за прозрачную пробу. Номер шкафа и чужая печать годятся как улика.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `nii_market_receipt` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nii_market_receipt`, how it was inspected, and exact checks run.

---

## Item 238: nii_sample_container

Original metadata from deleted `sprite_item_238.md`:

- `status`: planned
- `item_id`: `nii_sample_container`
- `item_name_ru`: Тара НИИ для пробы
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nii_sample_container` (`Тара НИИ для пробы`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nii_sample_container`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nii_sample_container`.
- Russian name: `Тара НИИ для пробы`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `65`.
- Spawn weight: `0`.
- Stack max through `getStack()`: `4`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `audit`, `container`, `document`, `legal_handoff`, `nii`, `official`, `sampleware`, `science`, `sealed`, `trade`.
- Description: Пломбируемая тара НИИ с актом ответственности, местом под бирку и страхом потерять пломбу. Ею берут пробу законно; без журнала она уже повод для аудита.

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

- Expected reachability: non-generic route: verify quest, trade, factory, monster drop, scripted generator, debug spawn, or system handoff.
- World visibility path: `EntityType.ITEM_DROP` -> first positive `inventory[].defId` -> procedural item texture.
- Inventory visibility path: `drawInventory` / `drawContainerMenu` -> `drawItemIcon(defId)`.
- Debug path: item can be spawned through existing item/debug/map-editor paths if implementation needs visual inspection.

### Conflict Hotspots

- `src/render/item_sprites.ts`: shared procedural item visual rules. Coordinate with nearby item plans in batch `4_documents_access`.
- `src/render/webgl.ts`: orchestrator-owned generic hook only; avoid per-item branches.
- `src/render/stats_ui.ts` and `src/render/container_ui.ts`: UI icon layout is shared and should not be churned by per-item workers.

### Acceptance Checklist

- [x] `nii_sample_container` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nii_sample_container`, how it was inspected, and exact checks run.

---

## Item 239: nii_sample_label

Original metadata from deleted `sprite_item_239.md`:

- `status`: planned
- `item_id`: `nii_sample_label`
- `item_name_ru`: Наклейка НИИ для пробы
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nii_sample_label` (`Наклейка НИИ для пробы`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nii_sample_label`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nii_sample_label`.
- Russian name: `Наклейка НИИ для пробы`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `35`.
- Spawn weight: `0.45`.
- Stack max through `getStack()`: `10`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `document`, `label`, `legal_handoff`, `nii`, `sample`.
- Description: Малая наклейка с большим весом. Без неё даже чистая банка выглядит как рыночная фантазия.

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

- [x] `nii_sample_label` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nii_sample_label`, how it was inspected, and exact checks run.

---

## Item 240: noise_can

Original metadata from deleted `sprite_item_240.md`:

- `status`: planned
- `item_id`: `noise_can`
- `item_name_ru`: Шумовая банка
- `item_type`: `MISC`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: tool
- `batch`: 3_tools_repair_cleanup
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `noise_can` (`Шумовая банка`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `noise_can`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `noise_can`.
- Russian name: `Шумовая банка`.
- Type: `MISC`.
- Source file: `src/data/items.ts`.
- Value: `12`.
- Spawn weight: `0.7`.
- Stack max through `getStack()`: `6`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: `counterplay`, `decoy`, `noise`.
- Description: Банка с болтами на нитке. Используйте, чтобы дать короткий ложный шумовой след и сорвать внимание с маршрута.

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

- [x] `noise_can` still exists in `ITEMS`.
- [x] Russian name/description are not translated or accidentally changed.
- [x] Sprite is distinct from other `tool` items.
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

Report changed files, visual rule chosen for `noise_can`, how it was inspected, and exact checks run.

---

## Item 241: nosin_rifle

Original metadata from deleted `sprite_item_241.md`:

- `status`: planned
- `item_id`: `nosin_rifle`
- `item_name_ru`: Винтовка Носина
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `nosin_rifle` (`Винтовка Носина`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `nosin_rifle`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `nosin_rifle`.
- Russian name: `Винтовка Носина`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `640`.
- Spawn weight: `0.16`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `ammo_762`, `civilian_stash`, `militia`, `rifle`, `trade`, `weapon`.
- Description: Ополченский болтовик с длинным затвором. Урон 43. Медленный точный выстрел за один 7.62, без очереди и складского шума.

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

- [x] `nosin_rifle` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `nosin_rifle`, how it was inspected, and exact checks run.

---

## Item 242: note

Original metadata from deleted `sprite_item_242.md`:

- `status`: planned
- `item_id`: `note`
- `item_name_ru`: Записка
- `item_type`: `NOTE`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: document
- `batch`: 4_documents_access
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `note` (`Записка`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `note`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `note`.
- Russian name: `Записка`.
- Type: `NOTE`.
- Source file: `src/data/items.ts`.
- Value: `1`.
- Spawn weight: `1`.
- Stack max through `getStack()`: `1`.
- Equip slot: `none`.
- Has use action: `no`.
- Tags: none.
- Description: Чья-то записка: тайник, жалоба, адрес или предупреждение

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

- [x] `note` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `note`, how it was inspected, and exact checks run.

---

## Item 243: o15_multijet_flamer

Original metadata from deleted `sprite_item_243.md`:

- `status`: planned
- `item_id`: `o15_multijet_flamer`
- `item_name_ru`: 6О15-УТТХ
- `item_type`: `WEAPON`
- `source_item_file`: `src/data/items.ts`
- `visual_kind`: weapon
- `batch`: 1_weapons_ammo
- `owner`: unassigned
- `risk`: low
- `validation`: `npm run typecheck`, `npm run test:unit`

### Status

Complete. The sprite is implemented, visible through item drops, and reused by inventory/container grids through the shared item sprite renderer.

### Goal

Create a distinct procedural sprite/icon for `o15_multijet_flamer` (`6О15-УТТХ`) in the dirty survival-horror/post-Soviet GIGAHRUSH style. The player should understand the object family in about 0.2 seconds without reading the name.

### Mandatory Intake

- Read `README.md`.
- Read `architecture.md`.
- Read `Docs/SpriteItems/sprite_item_orchestrator.md`.
- Read this file.
- Inspect `src/data/items.ts` and any system that references `o15_multijet_flamer`.
- Check `git status --short` and do not overwrite unrelated dirty work.

### Current Source Facts

- Item id: `o15_multijet_flamer`.
- Russian name: `6О15-УТТХ`.
- Type: `WEAPON`.
- Source file: `src/data/items.ts`.
- Value: `4600`.
- Spawn weight: `0.012`.
- Stack max through `getStack()`: `1`.
- Equip slot: `weapon`.
- Has use action: `no`.
- Tags: `breach`, `deep_engineer_stash`, `engineer`, `flame`, `liquidator`, `napalm`, `slime_counterplay`, `weapon`.
- Description: Инженерная прожигалка с тремя соплами. Урон 4x3. Медленнее РОКСа, но режет узкий проход напалмом.

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

- [x] `o15_multijet_flamer` still exists in `ITEMS`.
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

Report changed files, visual rule chosen for `o15_multijet_flamer`, how it was inspected, and exact checks run.
