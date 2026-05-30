# Gigahrush Expansion Plan

Версия: 0.1
Статус: навигационный planning/reference документ
Назначение: входная карта к 10 техническим expansion-документам и обязательному foundation-документу для разработки Gigahrush во вселенной самосбора.

Этот файл не заменяет `desdoc.md` или `plans.md`. `desdoc.md` остается широким design-pressure snapshot, а `plans.md` теперь содержит краткий список нереализованных и частично реализованных expansion-хвостов. Здесь сохранена входная карта к техническим expansion-документам с игровым циклом, системами, интеграцией, производительностью, рисками и Definition of Done.

`README.md` не обновлялся, потому что эти документы описывают план разработки, а не уже реализованные факты.

## Линейка обновлений

| # | Expansion | Роль | Документ |
| ---: | --- | --- | --- |
| 00 | Диспетчер Самосбора | campaign director, pacing, cross-expansion chains, telemetry | `Docs/Expansions/00_samosbor_director/expansion.md` |
| 01 | Грибная смена | production survival: еда, грибницы, плесень, социальное давление | `Docs/Expansions/01_mushroom_shift/expansion.md` |
| 02 | Метро ошибочной линии | транспорт, маршруты, ошибочные высадки, moving hub | `Docs/Expansions/02_metro_error_line/expansion.md` |
| 03 | Райсовет и Живой архив | документы, пропуска, доступы, архив NPC и событий | `Docs/Expansions/03_raionsovet_archive/expansion.md` |
| 04 | Теплотрасса Ноль | пар, вентили, жара, pressure nodes, дешевые environmental hazards | `Docs/Expansions/04_heatline_zero/expansion.md` |
| 05 | Черный рынок 88 | scarcity, долги, контракты, нелегальные входы и рейды | `Docs/Expansions/05_black_market_88/expansion.md` |
| 06 | Школа ОБЖ имени гермодвери | эвакуация, grouped NPC, micro-perks, социальная ответственность | `Docs/Expansions/06_obzh_school/expansion.md` |
| 07 | Больничный блок карантина | finite medical conditions, карантин, медкарты, морг | `Docs/Expansions/07_hospital_quarantine/expansion.md` |
| 08 | Промзона концентрата | factory lines, abstract supply, рабочие смены, брак | `Docs/Expansions/08_concentrate_industry/expansion.md` |
| 09 | Лифтовая петля 404 | numbered floor pockets, floor instances, ошибки карты и памяти | `Docs/Expansions/09_elevator_loop_404/expansion.md` |
| 10 | Пустотный протокол | post-final local rule changes, backlash, VOID integration | `Docs/Expansions/10_void_afterprotocol/expansion.md` |

## Порядок внедрения

Рекомендуемый порядок не равен порядку важности. Он минимизирует зависимости:

0. `00_samosbor_director` - режиссер кампании и общий trace/cooldown/chain слой.
1. `01_mushroom_shift` - первый survival-production vertical slice.
2. `03_raionsovet_archive` - документы и доступы, полезные всем следующим расширениям.
3. `04_heatline_zero` - инфраструктурная опасность без новых больших этажей.
4. `05_black_market_88` - экономика и долги поверх уже появившихся ресурсов.
5. `08_concentrate_industry` - промышленный supply, когда рынок уже имеет спрос.
6. `07_hospital_quarantine` - последствия тела после появления тепла, плесени и промзоны.
7. `06_obzh_school` - групповая эвакуация и социальные последствия.
8. `02_metro_error_line` - транспортный слой после появления нескольких нужных destinations.
9. `09_elevator_loop_404` - numbered pockets после транспорта, архива и слухов.
10. `10_void_afterprotocol` - поздняя рамка, когда старые системы уже дают meaningful targets.

## Общие правила реализации

Каждый expansion должен сначала дать маленький playable slice. Новый этаж допустим только после доказанного room/pocket MVP. Все системы должны быть data-driven, cheap by default, с редкими ticks, cooldowns, bounded state и debug-командами. Если какая-то идея требует постоянной симуляции всего мира, ее нужно заменить локальным состоянием, агрегатом или визуальным фейком.

Самосбор остается главным антагонистом. Ни один expansion не должен отключать его глобально, объяснять полностью или превращать игрока в избранного. Победа локальна: дверь, комната, маршрут, смена, человек, запись.

`00_samosbor_director` - обязательный слой перед массовой реализацией DLC. Без него каждое расширение начнет делать собственный scheduler, свои cooldowns, свои слухи и свои последствия. Это прямой путь к разрозненной игре.
