# Система этажей и вертикального мира

> Центральный документ ключевой системы.
>
> Роль: описывает вертикальный мир ГИГАХРУЩА как набор этажей-микромиров, route keys, floor memory, генераторов, геометрий, контента, населения, лута и локальных правил. Это не backlog геометрии и не список отдельных floor pitch; это рамка, через которую читаются `README.md`, `architecture.md`, `anomalies.md`, `balance.md`, `economics.md`, `alife.md`; внешний appendix `../gatbage/reference/design_floors/` открывается только для floor/route planning задач.

## Главная модель

Мир игры состоит из вертикального маршрута примерно на сотню этажей в текущем билде и может расширяться к 128 route-остановкам без добавления новых `FloorLevel`. В коде это не 100 enum-значений, а один `FloorRun`: `z=-50..+50`, story floors, authored design floors, procedural stops и редкие numbered lift instances. Каждый stop имеет стабильный `floorKey`, route role, базовый `FloorLevel`, danger, генератор, population profile, лут, NPC/monster давление, фракционную ситуацию, route anchors и память посещений.

Ключевой принцип: **одновременно живет один этаж**. Активный `World` - это 1024x1024 тороидальное клеточное поле, где симулируются игрок, NPC, монстры, предметы, projectiles, двери, контейнеры, следы, кровь, пули, фракции, события, самосбор и локальная топология. Остальные этажи не pathfind, не дерутся и не тикают needs; они существуют как floor memory, A-Life records, route specs, saved snapshots, economy/faction/caravan summaries и explicit events.

Этаж в ГИГАХРУЩЕ должен ощущаться как маленький мир:

- своя геометрия и правила движения;
- свои комнаты, POI, лифты, переходы, укрытия и route shortcuts;
- свой набор NPC, монстров, factions, rumors, contracts and quest hooks;
- своя экономика: контейнеры, лутовые bias, scarcity, производство, торговцы, караваны;
- своя опасность: самосбор, anomaly, монстр-экология, patrol response, debt, доступы;
- своя память: открытые двери, кровь, пули, украденные предметы, мертвые persistent NPC, последствия самосбора.

## Story Floors, Design Floors, Procedural Floors

**Floor Generation System:**
- **Even-numbered floors** (`Z % 2 === 0`) are separate, independent design modules. Each is authored as a standalone package without inheriting biomes.
- **Odd-numbered floors** (`Z % 2 !== 0`) are procedurally assembled by randomly mixing pieces of other floors and introducing procedural anomalies.


Authored design floors - ручные route-stop packages с string id в `src/data/design_floors.ts` и генератором в `src/gen/design_floors/`. Это банковский этаж, архивы, коммунальные кольца, рынки, метро, подад, крыши, лаборатории, производственные пояса и другие сильные места. Они нужны там, где этаж должен иметь уникальную читаемую структуру, персонажей, решения и контент.

Procedural floors - промежуточные roguelike-этажи между рукотворными остановками. Их описывает `anomalies.md`: geometry profile, majority faction, anomaly profile, danger, seed, loot bias and monster bias. Procedural floor не слабее design floor по системной честности: он обязан иметь достижимые лифты, комнаты, лут, угрозы, решение и память.

Numbered lift instances - редкие lift anomalies с `floor_instance:<id>` ключом. Они не являются новым `FloorLevel`; это route-key pocket worlds, которые обязаны жить в том же контракте floor memory, лифтов, debug path and samosbor aftermath.

## Геометрия как язык этажа

Идеи из архивированного `geometry.md` теперь принадлежат этому документу как общая floor-дисциплина:

- Любая геометрия компилируется в текущий `World`: `cells`, `roomMap`, `zoneMap`, `wallTex`, `floorTex`, `features`, `rooms`, `doors`, lifts and marks.
- Все координаты тороидальны: использовать `world.idx`, `world.wrap`, `world.delta`, `world.dist`, `world.dist2`.
- Heavy math допустим на generation-time, если bounded; runtime geometry mutations должны быть sparse, cached, cadence-bounded and dirty-version aware.
- Генератор должен создавать реальные `Room` records, coherent doors, reachable floor/corridor space, route anchors and shelter/repair paths.
- Геометрия не создает A-Life identity and no population refill. Она дает поля размещения, anchors, templates and readable routes.
- Самосбор может перестраивать геометрию, но protected apartments, hermetic shelter walls, route lifts and critical anchors должны иметь protection/repair logic.
- Хорошая floor geometry строится не только комнатами, а decision triangles: короткий рискованный путь, длинный безопасный обход, reward pocket, fallback, repair option, faction route, monster pressure.

Исследовательские семьи геометрии, которые остаются полезными для будущих floors: maze graph, BSP slabs, Poisson apartment blocks, Wilson/braided paths, Potts/Ising social domains, Voronoi quarantine cells, Hilbert/storage paths, Penrose laundry, Cayley/byuro transformations, reaction-diffusion nurseries, hyperbolic switchyards, attractor courtyards, Markov stairwells, spectral sound floors, sandpile collapse, runtime topology patches and proxy-grid metrics. Их нельзя подключать как абстрактную математику ради математики; каждая семья должна давать маршрутное решение, читаемость, performance cap and test.

## Связи с другими системами

- `architecture.md`: общий слой `core/data/gen/systems/render`, `World`, save/load, floor memory, route keys.
- `anomalies.md`: procedural floors, клеточная динамика, runtime anomaly state.
- `alife.md`: кто живет на этаже, кто уже умер, что переносится между этажами.
- `ai.md` and `fight.md`: как materialized actors двигаются, реагируют, дерутся and leave consequences.
- `economics.md` and `balance.md`: лут, деньги, ресурсы, цены, награды, depth pressure and scarcity.
- `quests.md`: story path, floor quests, procedural assignments, route targets and characters.
- `items.md` and `monsters.md`: что лежит, чем пользоваться, кто охотится, какие counterplay decisions появляются.
- `../gatbage/reference/design_floors/`: external appendix authored floor packets, only for floor/route planning tasks.
- `../gatbage/reference/procedural_floors/`: external appendix procedural geometry/anomaly authoring details, only for authoring tasks.

## Правила добавления этажа

1. Не добавлять новый `FloorLevel` ради route stop.
2. Дать floor key, z/route role, base floor, danger and source data.
3. Создать generator/package, а не частные branches in `main.ts`.
4. Сформировать настоящие комнаты, двери, лифты, route anchors and reachable paths.
5. Дать population/loot/monster/faction/quest hooks через data/registries.
6. Описывать сюжетные route gates через data-owned gate definitions: target route key, quest predicate/tag, lift direction mutation and bounds; runtime only applies matching open gates.
7. Проверить samosbor/floor memory: что остается, что перестраивается, что не ломает выход.
8. Добавить debug/test route for generation, reachability, lifts, protected rooms, NPC-free lower route if applicable.

Этаж без решения игрока остается декорацией. Этаж с решением, памятью и последствиями становится частью ГИГАХРУЩА.
