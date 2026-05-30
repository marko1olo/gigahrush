# Expansion Index

Статус: рабочий индекс для разработки  
Связанные файлы: `../../README.md`, `../../desdoc.md`, `../../architecture.md`; старые root `expansion.md` и `plans.md` архивированы в `../../gatbage/`.

## Назначение

Этот каталог содержит 11 самостоятельных technical design documents и один mandatory foundation-layer. Каждый `expansion.md` должен читаться как dev-epic/reference packet: что добавляем, зачем это нужно игре, какие системы трогаем, как не ломаем производительность и как проверяем минимальный playable slice. Текущие shipped-факты живут в `../../README.md` и root system docs; архивная сводка старых хвостов лежит в `../../gatbage/plans.md`.

## Документы

| ID | Название | Главная система | MVP без нового большого этажа |
| --- | --- | --- | --- |
| `00_samosbor_director` | Диспетчер Самосбора | campaign director, beat chains, pacing, telemetry | да |
| `01_mushroom_shift` | Грибная смена | грибы, еда, плесень, социальный дефицит | да |
| `02_metro_error_line` | Метро ошибочной линии | маршруты, поезд-хаб, ошибки высадки | да |
| `03_raionsovet_archive` | Райсовет и Живой архив | документы, доступы, архив | да |
| `04_heatline_zero` | Теплотрасса Ноль | discrete heat nodes, пар, вентили | да |
| `05_black_market_88` | Черный рынок 88 | долги, scarcity, контракты | да |
| `06_obzh_school` | Школа ОБЖ имени гермодвери | групповая эвакуация, micro-perks | да |
| `07_hospital_quarantine` | Больничный блок карантина | finite medical conditions, карантин | да |
| `08_concentrate_industry` | Промзона концентрата | factory lines, abstract supply | да |
| `09_elevator_loop_404` | Лифтовая петля 404 | numbered floor instances | да |
| `10_void_afterprotocol` | Пустотный протокол | late-game local protocols with backlash | да |
| `11_net_terminal_gen_map_editor` | НЕТ-ТЕРМИНАЛ ГЕН: редактор карты | debug/diegetic current-floor map editor | да |

## Dependency Map

`00_samosbor_director` should be designed before broad implementation. It provides shared beat selection, cooldowns, cross-expansion chains, danger/relief budget, and black-box traces.

`01_mushroom_shift` feeds `05_black_market_88`, `07_hospital_quarantine`, and `08_concentrate_industry`.

`03_raionsovet_archive` supports access, permits, records, and false documents for every other expansion.

`04_heatline_zero` creates environmental hazards and repair hooks for `07_hospital_quarantine`, `08_concentrate_industry`, and `06_obzh_school`.

`05_black_market_88` is the economic exchange layer for production, medicine, metro access, and rare documents.

`02_metro_error_line` and `09_elevator_loop_404` are route/anomaly expansions. They should wait until enough destinations exist.

`10_void_afterprotocol` should remain late. It needs older systems as protocol targets; otherwise it becomes abstract lore.

`11_net_terminal_gen_map_editor` is optional/debug-adjacent. It should be implemented after one integrator has added the small `main.ts`/HUD/save hooks, because the rest can live in additive system/render/data modules.

`00_samosbor_director` remains active across all phases. It must not own gameplay systems directly; it only schedules small legal beats through adapters.

## Acceptance Rules For Future Implementation

Do not mark an expansion implemented because a room exists. MVP requires a loop: input, risk, decision, result, consequence, debug visibility.

Do not add a permanent `FloorLevel` unless a pocket or room-slice has already proven the mechanic.

Do not update `README.md` with these docs until code exists and build passes. `README.md` is factual, `desdoc.md` and these expansion docs are planning.

Do not make a low/ultra dichotomy. Each design must scale through weak, middle, high, and ultra devices using cheaper logic first and visual overkill later.
