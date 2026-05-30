# Система предметов, оружия, ресурсов и производства

> Центральный документ предметной системы.
>
> Роль: описывает items, tools, weapons, PSI clots, loot, resources, future crafting/production, food, water, value, use effects, procedural sprites and economy hooks. Связан с `economics.md`, `balance.md`, `alife.md`, `fight.md` and `quests.md`.

Актуально на 2026-05-30. Этот файл описывает уже работающую предметную систему, а не список будущих item-кандидатов. Архивные item-манифесты и оркестратор перенесены в `gatbage/`.

## Слой данных

Базовая единица - `ItemDef` в `src/data/items.ts`: `id`, русское `name`, `ItemType`, `desc`, `spawnRooms`, `spawnW`, `value`, опциональные `tags`, `stack`, `durability` и `use`. Сейчас registry содержит 434 item id.

`ItemType` намеренно грубый: `FOOD`, `DRINK`, `MEDICINE`, `WEAPON`, `TOOL`, `KEY`, `NOTE`, `MISC`, `AMMO`. Новые подтипы обычно выражаются tags, use-handler, weapon stats, resource mapping или production recipe. Новый enum нужен только если существующие каналы не могут выразить поведение без частных костылей.

`ITEM_TAGS` - основной язык сквозной интеграции. Через tags предмет становится документом, контрабандой, sampleware, repair input, bait, cleanup tool, ammo family, resource member, production input, counterplay item или route clue. Логика должна читать ids/tags, а не русские display names.

## Инвентарь и использование

Runtime-предметы хранятся как compact stacks: `defId`, `count`, опциональное `data`. Стекуемость выводится из типа и `stack`; оружие и инструменты обычно занимают отдельный слот, durable tools расходуют `durability`. `src/systems/inventory.ts` владеет категориями, equip/use/drop/read/check actions, ammo consumption, tool durability, use-events и player-facing сообщениями.

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

ПСИ-сгустки используют тот же weapon contract, но платят `psiCost` и могут иметь `psiEffect`. Они остаются предметами и ресурсом, а не отдельной магической подсистемой вне инвентаря.

## Ресурсы и производство

`src/data/resources.ts` связывает предметы с экономическими ресурсами: вода, еда, медицина, металл, патроны, инструменты, бумага, топливо, электроника, ПСИ, образцы слизи, контрабанда, документы, industrial slurry, грибной субстрат, желемыш и трудочасы. Сейчас есть 17 resource defs.

`src/data/factories.ts` описывает production surfaces: factories, recipes, inputs, inputItems, outputs, access, cycleSec, bad batches and repair outputs. Сейчас есть 12 factory defs и 42 recipes. Это текущий путь для будущего crafting/resource gameplay: не добавлять глобальный crafting UI, пока recipe можно сделать через room/factory/container/contract.

Рецепт должен иметь достижимые inputs, полезный output, access decision и bounded cadence. Bad batch допустим как factory rule, если у него есть repair path и событие; он не должен превращаться в скрытый таймер без игрокового решения.

## Достижимость

Предмет считается shipped только если игрок может встретить или использовать его нормальным путем:

- room loot через `spawnRooms`/`spawnW`;
- container pool, faction/owner/locked/secret access;
- NPC trade, contract, quest, route floor, samosbor aftermath;
- factory output или repair input;
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
