# Items 5: Trade, Production, Contraband, Electronics And Resident Goods

Status: parallel implementation plan, not shipped behavior. Created 2026-05-24 for a future GPT-5.5 worker.

This worker owns black-market goods, production inputs, electronics, repair parts, resident valuables, vending/terminal goods, blueprints and noncombat economy expansion. Weapons belong to `items_2.md`; official documents belong to `items_3.md`.

## Intake

Read before editing:

- `README.md`
- `architecture.md`
- `items.md`
- `src/data/items.ts`
- `src/data/resources.ts`
- `src/data/factories.ts`
- `src/data/economy.ts`
- `src/systems/economy.ts`
- `src/systems/inventory.ts`
- `src/systems/contracts.ts`
- `tests/data-ids.test.ts`
- `tests/events-economy.test.ts`
- `tests/economy-trade.test.ts`
- `tests/inventory-rpg.test.ts`

Useful sources:

- Archive factory: production includes radio, chemical, construction, food and military goods: https://samosborarchive.fandom.com/ru/wiki/Завод
- Samosbor basics: ventilation, filters, food/water limits and coupons: https://samosb0r.fandom.com/ru/wiki/Основы_сеттинга
- Samosbor railway: hermetic gates, relays, rail materials, missing diagrams: https://samosb0r.fandom.com/ru/wiki/Железные_дороги
- Minecraft item category for resident/crafting objects: https://samosborminecraft.fandom.com/ru/wiki/Категория:Предметы
- Minecraft automagazine for vending/shop goods: https://samosborminecraft.fandom.com/ru/wiki/Автомагазин
- Minecraft blueprints for tiered production unlocks: https://samosborminecraft.fandom.com/ru/wiki/Чертежи

## Ownership

Preferred write set after orchestrator approval:

- New pack file if pack registry exists: `src/data/item_packs/trade_production.ts`
- Optional sole narrow ownership of `src/data/factories.ts` for recipes
- Optional `src/data/resources.ts` mapping
- Optional black-market/trade stock rows if a local registry exists

Do not edit:

- broad economy pricing algorithm unless orchestrator assigns
- `main.ts`
- render

## Existing Items To Improve, Not Break

| Existing id | Keep | Improvement angle |
| --- | --- | --- |
| `metal_sheet`, `gear`, `spring` | Existing metal parts. | Use in weapon/tool/factory recipes. |
| `barrel_part`, `magazine_part` | Existing weapon parts. | Tie to homemade pistol and liquidator weapon repair. |
| `circuit_board`, `fuse`, `relay_diagram`, `lamp_bulb` | Existing electronics. | Use in terminal/sensor/rail repair. |
| `duct_tape`, `wire_coil`, `rubber_strip`, `glass_shard` | Existing repair/craft parts. | Keep as generic production inputs. |
| `govnyak_*` | Existing contraband lane. | Do not dilute; add courier/receipt/proof support only. |
| `cigs` | Existing contraband/social item. | Keep simple barter role. |
| `stolen_archive_card`, `nii_market_receipt` | Existing illegal/evidence papers. | Use as black-market patterns. |
| `noise_can`, `radio_jammer`, `felt_door_pad`, `chalk` | Existing counterplay tools. | Improve reachability and contracts. |
| `flashlight`, `radio`, `fog_detector`, `unpeople_detector` | Existing electronics/tools. | Use parts/repair loops rather than duplicate devices. |

## Candidate Backlog

Target this stream: 35-45 accepted entries or improvements.

| Mode | Proposed id | Russian name | Type | Role | Reachability | Implementation note |
| --- | --- | --- | --- | --- | --- | --- |
| new | `blueprint_t1_folder` | Папка чертежей Т1 | MISC | Basic recipe unlock | Cabinets/vending | Coordinate with items_3 if document-owned. |
| new | `blueprint_t2_folder` | Папка чертежей Т2 | MISC | Better recipe unlock | Fibrous capsule/terminal | Use factory recipe gates later. |
| new | `blueprint_t3_folder` | Папка чертежей Т3 | MISC | Rare recipe unlock | Frozen item/deep route | High-value, stack 1. |
| new | `weapon_blueprint_t2` | Чертёж оружия Т2 | MISC | Armory recipe unlock | Black market/HQ | Do not unlock combat directly without stats. |
| new | `homemade_ammo_instruction` | Инструкция кустарных патронов | MISC | Enables homemade ammo path | Cabinets/black market | Source-backed from homemade pistol page. |
| improve | `barrel_part` | Заготовка ствола | MISC | Existing weapon component | Current item | Use in recipes. |
| improve | `magazine_part` | Детали магазина | MISC | Existing weapon component | Current item | Use in recipes. |
| new | `scrubbed_serial_plate` | Сбитая номерная планка | MISC | Contraband weapon proof | Black market | Audit/trade decision. |
| new | `stolen_filter_pack` | Краденая пачка фильтров | MISC | Cheap PPE supply with audit risk | Black market/stolen crate | Coordinate with items_1. |
| new | `black_market_shells` | Чёрнорыночная дробь | AMMO | Illegal shell source | Black market | Must resource-map and be reachable. |
| new | `contraband_shocker_parts` | Детали шокера | MISC | Shock baton production input | Black market/electronics | Coordinate with items_2. |
| new | `junior_tech_case` | Корпус «Юный техник» | MISC | Electronics casing | Cabinets/vending | Source item, map electronics. |
| new | `sound_emitter` | Звукоизлучатель | MISC | Craft/input or lure | Cabinets | Existing `noise_can` may cover active lure. |
| new | `keyboard_unit` | Клавиатура | MISC | Terminal hack/scrap part | Office/living | Use electronics resource. |
| new | `screen_unit` | Экран | MISC | Terminal repair part | Office/living | Use electronics resource. |
| new | `krona_battery` | Батарейка «Крона» | MISC | Portable power | Cabinets/vending | Could support tools. |
| new | `heating_element` | Нагревательный элемент | MISC | Still/heater/thaw input | Production/kitchen | Coordinate with items_4. |
| new | `electrode_pack` | Электроды | MISC | Welding/repair consumable | Production/storage | Good factory input. |
| new | `wire_bundle` | Провода | MISC | Electrical repair input | Existing `wire_coil` may cover | Deduplicate with existing. |
| improve | `wire_coil` | Моток провода | MISC | Existing wire item | Current item | Add source roles. |
| new | `water_filter_regulator` | Регулятор фильтра воды | MISC | Water system repair | Kitchens/Maintenance | Source-backed by ventilation/water system. |
| new | `pump_impeller` | Крыльчатка насоса | MISC | Water/pump repair | Production/Maintenance | Use with `pump_passport`. |
| new | `vent_damper_plate` | Заслонка вентиляции | MISC | Vent repair/control | Maintenance | No global vent sim. |
| new | `rail_switch_handle` | Рукоять стрелочного перевода | MISC | Railway route repair | Depot/transport | Coordinate with route content. |
| new | `rail_signal_lamp` | Сигнальная лампа депо | MISC | Rail/terminal repair | Depot/office | Electronics resource. |
| new | `rail_spike_pack` | Пакет костылей | MISC | Rail repair material | Depot/production | Metal resource. |
| new | `track_diagram_scrap` | Обрывок схемы путей | MISC | Transport clue | Depot/office | Source says docs were removed. |
| new | `import_toiletpaper` | Туалетная бумага «Импорт» | MISC | Vending/barter good | Automagazine/bathrooms | Existing `toiletpaper` may cover. |
| improve | `toiletpaper` | Туалетная бумага | MISC | Existing barter/hygiene | Current item | Add vending/trade role rather than duplicate if no difference. |
| new | `roller_brush` | Валик | MISC | Painting/repair item | Vending/storage | Could support wall marks/HARMS later. |
| new | `aerosol_paint_maiden` | Аэрозольная краска «цвет девства» | MISC | Tag/mark/contraband item | Storage/black market | Avoid visible render feature unless generic. |
| new | `plastic_sheet` | Пластик | MISC | Craft material | Vending/production | Resource electronics/tools. |
| new | `ceramic_shards_pack` | Керамика | MISC | Craft/insulation material | Vending/storage | Source automagazine. |
| new | `cardboard_stack` | Картон | MISC | Craft/barter material | Vending/living | Cheap resource. |
| new | `cloth_roll` | Ткань | MISC | Bandage/filter/clothing input | Living/storage | Existing items maybe cover; dedupe. |
| new | `rubber_tube` | Резиновая трубка | MISC | Still/medical/repair input | Medical/production | Useful recipe piece. |
| new | `bottle_empty` | Бутылка | MISC | Water/reagent/brewing container | Kitchens/living | Coordinate with items_4. |
| new | `sugar_pack` | Сахар | FOOD | Brewing/food/barter | Kitchens/vending | Could be small food. |
| new | `braga_bucket` | Ведро браги | MISC | Brewing intermediate | Kitchens/black market | Future production. |
| new | `moonshine_still_part` | Деталь самогонного аппарата | MISC | Contraband production input | Production/black market | No full brewing UI unless assigned. |
| new | `dice_bone` | Игральные кости | MISC | Gambling/social good | Living/common | Connect to existing gambling machines. |
| new | `resident_trinket_box` | Коробка жильцовых мелочей | MISC | Loot table wrapper/trade good | Living/storage | Data-only value item. |
| new | `party_portrait_pin` | Значок с портрета партии | MISC | Bureaucratic bribe/junk | Office/common | Low-value flavor with trade use. |
| new | `stolen_terminal_stamp` | Украденная печать терминала | MISC | Forgery/economy risk | Office/black market | Coordinate with items_3. |
| new | `market_weight_scale` | Рыночные весы | MISC | Trade stall proof/item | Market/storage | Future economy content. |

## Implementation Notes

- Prefer resource/factory usefulness over one-off flavor.
- Do not add a broad crafting UI. Use existing factories, contracts, terminals or future recipe unlock tokens.
- Black market goods should have either contraband tags, forged/evidence links, or a meaningful price/reputation risk.
- Resident goods can be simple low-value loot if they enrich trade/resource pools.
- Avoid putting many high-frequency junk items into generic spawn without resource pressure; room loot can become noisy.

## Acceptance Checklist

- Every production item maps to a resource or has a reason not to.
- Every factory recipe uses reachable inputs and useful outputs.
- No item is added only because it appeared on a wiki list.
- Existing near-duplicates are improved before adding a new id.
- Run `npm run check`; run economy tests if factory/economy data changes.

