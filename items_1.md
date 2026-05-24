# Items 1: Liquidator Cleanup, PPE And Samosbor Field Gear

Status: parallel implementation plan, not shipped behavior. Created 2026-05-24 for a future GPT-5.5 worker.

This worker owns cleanup gear, liquidator field tools, protective equipment, filters, decontamination supplies and samosbor-aftercare tokens. Do not implement broad combat weapon balance here; use `items_2.md` for weapons and ammo.

## Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `src/data/items.ts`
- `src/data/resources.ts`
- `src/systems/inventory.ts`
- `src/systems/samosbor_hooks.ts`
- `src/systems/events.ts`
- `tests/data-ids.test.ts`
- `tests/inventory-rpg.test.ts`

Useful sources:

- Archive: Liquidators use protective equipment, radios, light sources and slime containers: https://samosborarchive.fandom.com/ru/wiki/Ликвидаторы
- Archive: gas mask protects from gas, slime, fungus and mold vapors: https://samosborarchive.fandom.com/ru/wiki/Противогаз
- Archive: slime is cleaned by liquidators, studied by NII and changes by age: https://samosborarchive.fandom.com/ru/wiki/Слизь
- Samosbor wiki: liquidators include militia, regulars and engineer-assault units: https://samosb0r.fandom.com/ru/wiki/Ликвидаторы
- GUSL index: equipment classes include 0 noncombat gear and 8 personal gear: https://samosb0r.fandom.com/ru/wiki/Индекс_Главного_управления_снаряжения_ликвидаторов
- Minecraft item category, used as adaptation texture only: https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы

## Ownership

Preferred write set after orchestrator approval:

- New pack file if pack registry exists: `src/data/item_packs/liquidator_cleanup.ts`
- Otherwise narrow additions in `src/data/items.ts`
- Optional generic use handlers: `src/systems/liquidator_cleanup_items.ts`
- Optional resource mapping in `src/data/resources.ts`
- Optional reachability module under Maintenance or Living only if the item cannot be reached through existing room loot, contracts or containers

Do not edit:

- `src/main.ts`
- `src/core/world.ts`
- `src/render/webgl.ts`
- broad AI/pathfinding

## Existing Items To Improve, Not Break

| Existing id | Keep | Improvement angle |
| --- | --- | --- |
| `uv_spotlight` | Liquidator anti-eye/anti-spirit tool already exists. | Add clearer source path and contracts before adding more UV devices. |
| `gasmask_filter` | Existing tool/electronics resource item. | Make it part of filter pressure and PPE economy. |
| `filter_layer` | Existing industrial/electronics/filter input. | Use in recipes for gas mask service, not as generic trash. |
| `asbestos_cord` | Existing heatline/repair item. | Use as hermetic sealing input; avoid duplicate `asbestos_seal_cord` unless mechanically distinct. |
| `sealant_tube` | Existing repair item. | Use in door/gasket cleanup decisions. |
| `hermo_gasket` | Existing tool resource. | Connect to temporary hermetic repairs. |
| `cleaning_kit` | Existing active tool. | Let cleanup contracts ask for it or consume durability. |
| `vacuum` | Existing active tool against fog/light. | Keep as weird household alternative to liquidator gear. |
| `liquidator_ration` | Existing food. | Use as locked stash/field kit content. |
| `brown_slime_cleanup_act` | Existing evidence item. | Make it one of several cleanup proof tokens. |

## Candidate Backlog

Target this stream: 28-36 accepted entries or improvements. Each accepted item must have an actual reachability path.

| Mode | Proposed id | Russian name | Type | Role | Reachability | Implementation note |
| --- | --- | --- | --- | --- | --- | --- |
| new | `liquidator_rake` | Грабли ликвидатора 0Г15 | WEAPON | Long weak melee plus slime cleanup identity | Liquidator stashes, samosbor cleanup contracts | Stats in items_2 only if it becomes combat-relevant. |
| new | `rusty_rake` | Ржавые грабли | WEAPON | Bad starter cleanup weapon | Storage, abandoned cells | Upgrade input for `liquidator_rake`. |
| improve | `uv_spotlight` | УФ-прожектор ликвидатора | TOOL | Counterplay against eye/skinless/black traces | HQ, liquidator stashes | Add tags `liquidator`, `cleanup`, `uv`. |
| new | `ip4_gasmask` | Противогаз ИП-4 | TOOL | Respiratory PPE token | HQ, rare trade, liquidator issue | Use durability/filter state if generic handler exists. |
| new | `p14_gasmask_receipt` | Квитанция 8П14 | MISC | Paper access to gas mask issue | Office/HQ | Pairs with `filter_receipt`. |
| improve | `gasmask_filter` | Фильтр противогаза | MISC | Consumable protection pressure | Medical, storage, liquidator stash | Map to `tools` or new filter resource only if orchestrator approves. |
| new | `used_gasmask_filter` | Отработанный фильтр | MISC | Evidence/junk after PPE use | Produced by use handler | Sell cheap, audit contamination. |
| new | `wet_rag_bundle` | Мокрые тряпки | MISC | Emergency gas/smoke mitigation | Bathrooms/kitchens | Short weak alternative, no new armor system. |
| improve | `asbestos_cord` | Асбестовая верёвка | MISC | Hermetic sealing input | Production/storage | Treat as existing item, add tags/reachability if needed. |
| new | `rubber_door_wedge` | Резиновый клин гермодвери | MISC | Door hold / quick seal proof | Maintenance, storage | Use only through generic door/interaction hooks. |
| improve | `hermo_gasket` | Гермопрокладка | MISC | Door/lift seal repair | Maintenance, storage | Pair with `sealant_tube`, `asbestos_cord`. |
| improve | `sealant_tube` | Тюбик герметика | MISC | Cheap repair consumable | Existing rooms | Make visible in cleanup recipe/contract list. |
| new | `decon_fluid` | Обеззараживающая жидкость | MISC | Slime/fungus cleanup reagent | Medical, Maintenance, liquidator stash | Use handler can publish cleanup event. |
| new | `alkali_powder` | Щёлочная присыпка | MISC | Brown slime cleanup input | Storage/production | Pairs with `brown_slime_cleanup_act`. |
| new | `lime_bucket` | Ведро извести | MISC | Body/slime sanitation token | Production/storage | Heavy trade/evidence item. |
| new | `zinc_slime_bucket` | Цинковое ведро для слизи | MISC | Cleanup proof, sample transport | Samosbor aftermath, Maintenance | Keep stack 1. |
| improve | `nii_sample_container` | Тара НИИ для пробы | MISC | Official sampleware | Existing item | Cross-reference with `items_4.md`. |
| new | `cleanup_tongs` | Санитарные щипцы | TOOL | Safer sample pickup / corpse handling | Medical/HQ | Durability-based tool. |
| new | `body_bag_roll` | Рулон мешков для тел | MISC | Aftermath contract item | HQ/medical | Turns death cleanup into decision: report vs hide. |
| new | `corpse_number_tag` | Номерок трупа | MISC | Identity/proof token | Cleanup aftermath | Use with A-Life death facts only if generic. |
| new | `portable_siren_key` | Ключ переносной сирены | MISC | Warning system repair token | HQ/office | Do not add new siren runtime unless generic. |
| new | `radio_headset_liquidator` | Гарнитура ликвидатора | TOOL | Heard-radius/radio affordance | HQ, trade | Could modify message radius through existing context later. |
| new | `field_radio_battery` | Батарея рации | MISC | Consumable electronics pressure | Storage/office | Map to electronics. |
| new | `liquidator_flashlamp` | Переносной прожектор | TOOL | Heavy light source, slower than flashlight | HQ/production | Reuse light/tool patterns if possible. |
| new | `ozk_patch` | Заплата ОЗК | MISC | PPE repair input | Medical/HQ/storage | No armor system unless planned. |
| new | `protective_apron` | Кислотный фартук | MISC | Lab/cleanup clothing token | NII/medical | Trade/evidence until protection hooks exist. |
| new | `cleanup_order_stub` | Корешок приказа на зачистку | MISC | Legal proof for loot/confiscation | Office/HQ | Goes to items_3 if document-heavy. |
| new | `slime_scraper` | Скребок для слизи | TOOL | Low-tech cleanup | Storage/production | Durability tool; not a better weapon. |
| new | `hermetic_tape` | Гермолента | MISC | Fast temporary seal | Storage/medical | Stackable consumable. |
| new | `smoke_candle_check` | Дымовая шашка проверки тяги | MISC | Vent inspection cue | Maintenance | Bounded event, no gas sim. |
| new | `post_samosbor_probe_kit` | Набор замера после самосбора | MISC | Turns aftermath into NII/liquidator handoff | HQ/NII | High value, stack 1. |
| new | `contaminated_gloves` | Загрязнённые перчатки | MISC | Bad cleanup consequence | Generated by failed handling | Low-value evidence/contraband. |

## Implementation Notes

- Keep most items data-only. Use tags and resource mappings before adding runtime behavior.
- If PPE has effects, implement one generic inventory-use handler or status helper. Do not add per-item branches in hot logic.
- Use `publishEvent()` for public cleanup facts: cleaned slime, sealed door, contaminated sample, hidden body.
- Samosbor interaction must be bounded: no per-frame full-floor scans, no refill systems, no global contamination simulation.
- Existing Russian tone is dry, concrete and functional; avoid lore dumps inside `desc`.

## Acceptance Checklist

- Every new id is lowercase snake_case.
- Every new item has `name`, `type`, `desc`, `spawnRooms`, `spawnW`, `value`.
- `spawnW: 0` items have a real route, contract, container, quest, factory or event source.
- Resource mapping added for scarcity-sensitive filters, decon fluid, electronics, fuel and papers.
- No new `ItemType`.
- No save shape bump unless persistent new state is added.
- Run at least `npm run typecheck`; prefer `npm run check` if use handlers or samosbor behavior are touched.

