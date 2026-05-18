# План 1: стабилизация, обязательный контент, баги и оптимизация

Дата: 2026-05-17  
Основа: текущий код `src/`, `README.md`, `architecture.md`, `audit.md`, `expansion.md`, `optimization.md`, `Docs/Expansions`, `Docs/AgentPrompts`.

После полного выполнения этого плана создаётся новый файл `plan_2.md` с очередным срезом задач, остаточными рисками и результатами проверки.

## Текущее состояние

- Проект уже имеет сильную базу: 6 этажей, манифесты контента, сюжетную цепочку, сайд-квесты, 22 типа монстров, контейнеры, экономику, производство, контракты, события, слухи, варианты самосбора, WebGL renderer и smoke script.
- `main.ts` остаётся главным интеграционным узлом: игровой цикл, ввод, бой, save/load, переходы этажей, меню, контейнеры, торговля и часть сюжетных событий.
- Расширительные точки уже есть: `src/gen/*/content_manifest.ts`, `registerSideQuest`, `registerZoneContent`, `systems/events.ts`, `gen/floor_manifest.ts`.
- `npm run typecheck` проходит.
- `npm run test:unit` проходит: 28 тестов.
- `node scripts/content-audit.mjs` проходит без duplicate ids, missing refs и unimported content modules.
- `npm run build` проходит: `dist/index.html 1,014.12 kB`, gzip `307.23 kB`.
- `npm run check` проходит.

## P0: сначала вернуть доверие к сборке

1. Починить strict TypeScript gate.
   - Статус: выполнено; strict TypeScript gate зелёный.

2. Добавить deterministic content QA.
   - Новый unit/script check для уникальности item ids, side quest ids, contract ids, rumor ids, monster variant ids.
   - Проверять ссылки квестов на существующие items, NPC ids, monster kinds и floors.
   - Проверять, что контентные модули с `registerSideQuest` или явным `spawn*` реально импортированы манифестом/спавнером.
   - Статус: выполнено; `scripts/content-audit.mjs` и unit-тесты закрывают registry/reference health.

3. Привести сюжетную цепочку к одному источнику правды.
   - Хак `targetRoomType: undefined as unknown as number` в `src/data/plot.ts` убран.
   - Шаги `plotStepIndex === 11` и `12` сейчас создаются вручную в `src/data/plot_events.ts`; либо внести их в `PLOT_CHAIN`, либо явно оформить как `PLOT_EVENT_QUESTS`.
   - Автозавершение VISIT Hell идёт через нормальный `visitFloor`, без подставных room fields.
   - Добавить тест на последовательность `PLOT_CHAIN`: каждый шаг можно принять и завершить существующей механикой.

4. Изолировать production/containers по этажам.
   - `ProductionState` теперь хранит `floor`.
   - Production tick/register/resource spending ограничены текущим этажом.
   - Добавлен тест: производство с одного этажа не пишет в контейнер другого этажа с тем же id.

5. Снять шум генераторов и улучшить маршрутизацию заданий.
   - Placement logs в `src/gen/**` проходят через `genLog()` и выключены по умолчанию.
   - Cross-floor VISIT quests показывают подсказки лифта в журнале, карте и `[E]` prompt.
   - Production output containers показывают последний выпуск/причину простоя; nearby production events попадают в log/HUD и rumor/dialogue.

6. Сверить README с фактом после P0.
   - README должен описывать только shipped behavior.
   - Не добавлять туда expansions до реализации.

## P1: обязательный контентный фундамент

1. Диспетчер самосбора.
   - Добавить маленький `samosbor_director`: scheduler, не новая система самосбора.
   - Биты: предупреждение, локальный остаточный туман, сбой двери, shortage, aftershock monster, слух, след в журнале.
   - Запуск только на phase transition или slow cadence.
   - Debug: показать state, force beat, clear cooldowns.
   - Все важные факты публиковать через `systems/events.ts`.

2. Продлить основной сюжет.
   - Текущий `PLOT_CHAIN` фактически идёт до Hell, а Void/Creator квесты спрятаны в `plot_events.ts`.
   - Добавить 5-8 нормальных шагов после Манкобуса: Hell contact, Herald clue, Void threshold, Creator reveal, return consequence.
   - Новые NPC/rooms только через floor content modules и manifests.
   - Не добавлять story-specific logic в `main.ts`.

3. Первый survival-production slice: грибная смена.
   - Один POI в Living или Kvartiry: грибная кухня/прачечная/подвал.
   - 2-3 NPC, 3-4 side quests: дезинфекция, выбор паёк vs заражённая еда, ремонт вентиляции, разоблачение кладовщика.
   - Связать с food scarcity или container loot, без живой симуляции плесени.
   - Wet/meat самосбор может дать bounded aftermath, но не глобальное распространение.

4. Райсовет / живой архив.
   - Сначала MINISTRY MVP: бюро, архивный доступ, пропуск/печать/справка.
   - Документы должны открывать или упрощать конкретные действия: доступ, контракт, штраф, квестовый обход.
   - Не добавлять новый `ADMIN` floor или вторую систему документов.

5. Теплотрасса Ноль.
   - MAINTENANCE MVP: 3-5 дискретных pressure/heat nodes, вентили, паровые hazard-клетки.
   - Реализация через room state, marks, fog tint, damage cooldowns.
   - Никакой fluid/steam simulation.

6. Чёрный рынок 88.
   - Сначала скрытый pocket/room, не новый большой этаж.
   - Долги, нелегальные контракты, scarcity goods, рейды через existing Quest/contract/economy.
   - Контракты перестать выдавать из любого NPC-menu; нужен board/broker/terminal.

7. Промзона концентрата.
   - Один factory line MVP: смена, входной ресурс, output crate, quality decision, consequences.
   - Использовать существующие `resources`, `factories`, `production`, `containers`.
   - Не симулировать рабочих и логистику per-frame.

8. Больничный блок и школа ОБЖ.
   - Hospital: finite conditions, quarantine room, med records, morgue hook.
   - School: grouped evacuation, micro-perks, escort/hide decisions.
   - Оба начинать как room/pocket slices без нового floor.

9. Поздние expansions отложить.
   - Metro error line и elevator loop 404 делать после появления достаточного числа meaningful destinations.
   - Void afterprotocol делать после стабилизации Hell/Void plot и director beats.

## P1: баги и игровые дыры

1. Контракты должны быть достижимыми и честными.
   - Сейчас `spawnContract(state)` берёт первый доступный контракт без учёта NPC, floor, broker, target availability.
   - Согласовать лимиты: `MAX_ACTIVE_QUESTS = 8`, а contracts режут общий журнал на `totalActive >= 5`.
   - У контракта должен быть источник: board/broker/terminal, floor/faction filter, reward preview.
   - KILL contracts должны гарантировать цель через spawn hook или выбирать только реально существующую цель.

2. Контейнеры: доступ и кража.
   - Проверить `owner` access: сейчас `Faction.PLAYER` делает owner containers доступными без theft consequence.
   - Добавить видимый 3D/HUD язык контейнеров: шкаф/сейф/ящик должен читаться до открытия.
   - Для locked/secret контейнеров нужен понятный route: ключ, инструмент, навык, слух или debug.

3. Save/load и floor persistence.
   - Сейчас сохраняются контейнеры текущего `world`, но этажи генерируются заново при переходе.
   - Решить явно: либо per-floor persistence для containers/production/important world facts, либо documented volatile floors.
   - Нельзя оставлять production глобальным без floor ownership.

4. Quest markers и cross-floor quests.
   - TALK/FETCH/KILL markers работают в пределах текущего entity/world набора.
   - Cross-floor target должен показывать floor hint или lift hint, а не молча исчезать.
   - VISIT floor quests должны отображать ближайший lift/down direction.

5. Генераторные логи.
   - В `src/gen/**` минимум 16 `console.log`.
   - Заменить на debug-gated logger или убрать production noise.

6. Сюжетные события и события мира.
   - `onHellArrival`, `tryCreateVoiceQuest`, `onVoidEntry`, `onHeraldKilled`, `onCreatorKilled` должны публиковать `WorldEvent`, не только HUD messages.
   - Слухи/журнал смогут читать эти факты без нового event bus.

7. Беспорядок с direct modulo.
   - В gameplay/systems постепенно заменить `((x % W) + W) % W` на `world.wrap`, где есть `world`.
   - В горячих местах делать только если не меняет поведение; не трогать shader/генераторный код без причины.

## P2: оптимизация после стабилизации

1. Read-only spatial buckets для entities.
   - Ускорить AI target scan, HUD interaction prompt, sprite visible pass, nearby NPC/monster checks.
   - Не менять AI decisions; buckets только acceleration layer.
   - Обновлять раз в frame/tick без per-entity closure allocation.

2. Renderer uploads.
   - Уже есть dirty versions для wall/floor/fog и door byte compare.
   - Следующий шаг: partial door-state uploads по dirty door indices.
   - Surface marks сейчас могут перезаливать full `surfaceIdx` texture; рассмотреть chunk/index dirty path.

3. Quest/map/HUD caches.
   - `map_ui` каждый draw строит active quest marker sets.
   - Перенести в frame/quest dirty cache, особенно для full map.
   - Interaction prompt не должен сканировать все NPC каждый HUD draw при 1000+ NPC.

4. Fog frontier.
   - `spreadFog()` делает 64 random samples every frame даже при малом числе fog cells.
   - Можно вести bounded frontier/ring для активного тумана и fallback random repair pass раз в несколько секунд.
   - Сохранить cheap cinematic behavior, не делать fluid sim.

5. Perf telemetry и smoke.
   - Добавить debug-only ring buffers: update ms, render ms, entity count, visible sprites, texture upload counts.
   - Расширить smoke: не только blank canvas, но start game, floor generation sanity, optional debug stats.
   - Проверки должны быть deterministic, без flaky timing thresholds.

6. Content generation profiling.
   - Замерить генерацию всех floors отдельно.
   - Особое внимание: `kvartiry/index.ts`, `gen/shared.ts` connectivity/percolation, `world.bakeLights`.
   - Оптимизировать только подтверждённые пики.

## P2: расширение контента по этажам

1. Living.
   - Грибная смена.
   - Hospital pocket.
   - OBZH school room.
   - Больше low-risk domestic decisions: ремонт, прятать NPC, кража пайка, обмен документами.

2. Kvartiry.
   - Усилить social pressure: очередь, типография, баррикада, коммунальная кухня должны иметь runtime consequences.
   - Добавить последствия бунта через события, слухи, отношения, цены.

3. Ministry.
   - Документы как реальные access keys.
   - Очередь/печать/допрос должны влиять на контракты, пропуска, штрафы, отношения.

4. Maintenance.
   - Pressure/steam MVP.
   - Водолазные тайники и водомерный пост связать с heat/pressure choices.
   - Трубные монстры должны иметь ecology loot или repair consequence.

5. Hell.
   - Herald chain сделать частью общего plot contract.
   - Добавить cult ecology: идолы, жертвенники, sealed herald rooms, локальная цена за shortcut.

6. Void.
   - Один afterprotocol MVP после Creator arc.
   - Local rule change, backlash, trace in world log.
   - Не объяснять весь самосбор.

## Definition of Done для этого плана

- `npm run check` проходит.
- Нет красного `npm run typecheck`.
- Есть deterministic content QA для registry/reference health.
- Production/containers/quests не смешивают этажи случайно.
- Основной сюжет после Hell/Void оформлен без ad hoc hidden quest indices.
- Минимум один новый playable content slice реализован и достижим обычной генерацией.
- `README.md` обновлён только фактическими shipped изменениями.
- После закрытия пунктов создан `plan_2.md`.
