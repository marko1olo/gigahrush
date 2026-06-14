# Система предметов, оружия, ресурсов и производства

> Центральный документ предметной системы.
>
> Роль: описывает items, tools, weapons, PSI clots, loot, resources, crafting/production, food, water, value, use effects, procedural sprites and economy hooks. Связан с `economics.md`, `balance.md`, `alife.md`, `fight.md` and `quests.md`.

Актуально на 2026-05-30. Этот файл описывает уже работающую предметную систему, а не список будущих item-кандидатов. Архивные item-манифесты и оркестратор перенесены в `../gatbage/`.

## Слой данных

Базовая единица - `ItemDef` в `src/data/items.ts`: `id`, русское `name`, `ItemType`, `desc`, `spawnRooms`, `spawnW`, `value`, опциональные `tags`, `stack`, `durability` и `use`. Сейчас registry содержит 434 item id.

`ItemType` намеренно грубый: `FOOD`, `DRINK`, `MEDICINE`, `WEAPON`, `TOOL`, `KEY`, `NOTE`, `MISC`, `AMMO`. Новые подтипы обычно выражаются tags, use-handler, weapon stats, resource mapping или production recipe. Новый enum нужен только если существующие каналы не могут выразить поведение без частных костылей.

`ITEM_TAGS` - основной язык сквозной интеграции. Через tags предмет становится документом, контрабандой, sampleware, repair input, bait, cleanup tool, ammo family, resource member, production input, counterplay item или route clue. Логика должна читать ids/tags, а не русские display names.

## Единый Источник Истины: Универсальный Процедурный Лут

Система `src/systems/procedural_loot.ts` является универсальным генератором лута, который опирается на реестр `ItemDef` (`ITEMS` в `src/data/items.ts`) как на Единый Источник Истины. 

Эта система устраняет необходимость в жестком хардкоде инвентарей (например, таблиц для каждого NPC или контейнера отдельно) и опирается на параметры самих предметов:
- `value`: Ценность предмета сопоставляется с бюджетом лута (который зависит от уровня сущности, глубины/опасности этажа).
- `ItemType` и `tags`: Определяют предпочтения фракций, классов (огнестрел для ликвидаторов, медикаменты для ученых, и т.д.).
- `spawnW`: Базовый вес появления предмета.

**Планы интеграции:**
Система уже используется для генерации стартового инвентаря NPC (A-Life loadouts) и автоматической выдачи боеприпасов для их оружия.
В дальнейшем эта же система будет интегрирована для:
1. **Генерации лута в контейнерах:** Заполнение ящиков, сейфов и тайников на основе уровня этажа и фракции-владельца.
2. **Торгового инвентаря:** Генерация ассортимента торговцев с учетом их фракции, редкости и экономики (динамическое ценообразование на основе базового `value`).

Контейнеры также лишены легаси-хардкода `capacitySlots`. Все инвентари имеют универсальную вместимость в 64 слота (`MAX_INVENTORY_SLOTS`), а количество предметов, генерируемых в контейнерах, масштабируется процедурно в зависимости от глубины (номера этажа `Z`), обеспечивая больше добычи на глубоких опасных этажах.

## Инвентарь и использование

Runtime-предметы хранятся как compact stacks: `defId`, `count`, опциональное `data`. Стекуемость выводится из типа и `stack`; оружие и инструменты обычно занимают отдельный слот, durable tools расходуют `durability`. `src/systems/inventory.ts` владеет категориями, equip/use/drop/read/check actions, ammo consumption, tool durability, use-events и player-facing сообщениями.

World item drops подбираются через тот же inventory transfer path. Browser-local настройка автоподбора включена по умолчанию; если игрок выключает ее в `U` -> настройки интерфейса, item drops больше не берутся при проходе рядом и становятся `E`-целью с названием, описанием и ручным pickup prompt.

Использование предмета должно давать решение, а не только эффект:

- еда/вода закрывает needs, но может портить HP, статус или маршрутный риск;
- медицина лечит, снимает статус или меняет tradeoff;
- документы открывают доступ, создают audit risk, forged/legal fork или evidence handoff;
- инструменты чинят, чистят, светят, метят, герметизируют, вскрывают или дают counterplay;
- образцы и ПСИ-сгустки связывают НИИ, контрабанду, риск вскрытия, ресурс `slime_samples`/`psi` и события.

Важные действия публикуют `publishEvent()` с компактными tags/data. Горячий runtime не должен парсить JSON или сканировать весь мир ради предмета.

## Оружие

Физическое оружие живет в `src/data/weapons.ts`, ПСИ-сгустки - в `src/data/psi.ts`, объединенный read-only registry экспортируется из `src/data/catalog.ts` как `WEAPON_STATS`. Сейчас есть 70 физических weapon stat entries и 18 PSI entries.

Каждое `ItemType.WEAPON` должно иметь executable stats или быть явно небоевым предметом другого типа. Физические stats задают damage, range, speed, durability, ranged/ammo, projectile speed, pellets/spread, projectile type, AoE, beam flags и sound id. Role tiers дают HUD/readability язык: emergency melee, industrial tool, reach, heavy, control, sidearm, rifle, corridor shotgun, ammo burn, grenade, rare energy, fuel clear, PSI.

ПСИ-сгустки используют тот же executable weapon contract, но экипируются через `tool` slot, платят `psiCost` и могут иметь `psiEffect`. Они остаются предметами и ресурсом, а не отдельной магической подсистемой вне инвентаря.

## Ресурсы, крафт и производство

`src/data/resources.ts` связывает предметы с экономическими ресурсами: вода, еда, медицина, металл, патроны, инструменты, бумага, топливо, электроника, ПСИ, образцы слизи, контрабанда, документы, industrial slurry, грибной субстрат, желемыш и трудочасы. Сейчас есть 17 resource defs.

Игровой крафт отделен от макроэкономических `ResourceDef`. `src/data/craft_materials.ts` задает фиксированный вектор из 9 craft-компонентов: mechanics, electronics, consumables, bio, chemical, metal, cybernetics, psimatter, metamatter. `src/data/item_composition.ts` хранит composition для каждого предмета, а `src/data/craft_recipes.ts` строит item recipes поверх этих vectors. Это definition-level данные; runtime item stack не хранит состав в `Item.data`.

Рецепты становятся известны через default список и источники в `src/data/craft_recipe_sources.ts`: blueprint items, notes, quests, terminals, NPC/floor sources and recipe billboards. Станки открываются через interactive definitions `craft_lathe`, `disassembly_workbench`, `craft_lab_bench` and `recipe_billboard`; сборка и разбор используют player crafting state, а не factory production queues.

`src/data/factories.ts` описывает production surfaces: factories, recipes, inputs, inputItems, outputs, access, cycleSec, bad batches and repair outputs. Сейчас есть 12 factory defs и 42 recipes. Factories остаются floor/economy production path with cadence and access rules; крафт остается personal item/material path.

Рецепт должен иметь достижимые inputs, полезный output, access decision и bounded cadence. Bad batch допустим как factory rule, если у него есть repair path и событие; он не должен превращаться в скрытый таймер без игрокового решения.

## Достижимость

Предмет считается shipped только если игрок может встретить или использовать его нормальным путем:

- room loot через `spawnRooms`/`spawnW`;
- procedural NPC loadouts через `src/systems/procedural_loot.ts` (зависит от `value`, типов, фракционных тегов и множителей);
- container pool, faction/owner/locked/secret access;
- NPC trade, contract, quest, route floor, samosbor aftermath;
- factory output, craft recipe/source или repair input;
- one-per-run unique source с явным route/debug proof;
- use-handler, weapon stats, document gate, counterplay или event consequence.

`spawnW: 0` не делает предмет запрещенным, но требует явного источника. Мертвые registry entries без reachability не должны добавляться.

## Добавление предмета

Минимальный порядок:

1. Добавить `ItemDef` с lowercase snake_case id и русскими `name`/`desc`.
2. Добавить tags, если предмет участвует в ресурсах, документах, контрабанде, sampleware, counterplay или производстве.
3. Для оружия добавить `WeaponStats`/role tier или PSI stat.
4. Привязать ресурс в `resources.ts`, если предмет влияет на scarcity/economy.
5. Дать reachability через rooms, containers, factory, contract, NPC, route content or aftermath.
6. Добавить use-handler/event/test только если поведение не data-only.

Запрещены сотни near-duplicate guns, новый item type ради вкуса, renderer-owned item state, per-frame global gas/slime/fluid scans, save shape changes для data-only предметов и content-specific branches in `main.ts`, `core/world.ts`, `render/webgl.ts`.
