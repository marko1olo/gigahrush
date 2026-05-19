# Tester Report

Дата: 2026-05-18

## Объем проверки

Проверял production build и браузерную игру через Chrome headless/CDP:

- прочитаны `README.md` и `architecture.md`;
- запущены TypeScript, unit, content audit, production build;
- запущены стандартный smoke, expedition smoke и third-wave smoke;
- отдельным play-pass проверены title screen, старт, движение, стрельба, инвентарь, квесты, карта, фракции, журнал, debug overlay, story floors, procedural floor/anomaly teleports и первые authored design floors.

Не проверено полноценно:

- мобильное управление на реальном устройстве;
- звук на слух, только отсутствие падений в браузере;
- Cloudflare Net Sphere с реальным D1 binding;
- все authored design floors вручную: проверка заблокировалась из-за NPC menu/input issue, описанного ниже.

## Результаты команд

| Проверка | Результат | Детали |
| --- | --- | --- |
| `npm run check` | PASS | `typecheck`, 102 unit tests, content audit, production build прошли |
| `npm run smoke` | PASS | `hudLit=6217`, `sceneLit=202134`; 180 frames: avg `24.68ms`, p95 `41.60ms`, max `84.00ms` |
| `SMOKE_SCENARIO=expedition npm run smoke` | PASS | expedition path, debug setup, shooting, quest panel, lift interaction прошли; avg `19.31ms`, p95 `25.50ms`, max `34.10ms` |
| `SMOKE_SCENARIO=third-wave npm run smoke` | FAIL | после slime/sample route и force faction event игрок умер; rare samosbor/recovery не смогли открыться |

## Найденные проблемы

### P1. NPC menu на главной вкладке нельзя закрыть клавиатурой

Симптом: меню NPC показывает подсказку `ENTER — закрыть`, но на вкладке `main` обработчик закрытия отсутствует. `E` выбирает пункт, `W/S` двигают выбор, `Enter` не закрывает меню. После открытия меню игрок оказывается заперт в нем без очевидного клавиатурного выхода.

Доказательства:

- `src/render/npc_ui.ts:55` рисует подсказку `ENTER — закрыть`.
- `src/main.ts:3300-3333` для `state.npcMenuTab === 'main'` обрабатывает только `upEdge`, `dnEdge`, `interactEdge`; `escEdge` там не закрывает меню.
- В play-pass меню открылось после перехода на procedural/design floor и заблокировало дальнейший debug-тест.

Что сделать:

- На главной вкладке NPC menu закрывать `escEdge`/Enter.
- Рассмотреть закрытие также повторным `E` вне выбранного действия или отдельной явной кнопкой.
- Добавить smoke-проверку: открыть NPC menu, закрыть Enter, убедиться что игра вернулась в normal state.

### P1. `E`/interact протекает через floor transition и сразу открывает NPC menu на новом этаже

Симптом: после выбора debug teleport клавишей `E` следующий этаж иногда появляется уже с открытым NPC menu, потому что игрок спавнится лицом к NPC, а input edge/hold от выбора команды переживает переход. Это воспроизвелось на random procedural floor и `antenna_court`.

Влияние:

- ломает debug QA проход по этажам;
- потенциально может влиять и на обычные переходы через лифт, если игрок удерживает `E`;
- может вызывать случайные диалоги/контейнеры/двери сразу после загрузки.

Что сделать:

- При любом floor transition очищать `input.interact`, `prevMenuInteract` и похожие one-shot input flags.
- Ввести короткий post-transition interaction cooldown.
- В debug teleport после `pendingLoad` не переносить на новый этаж активный `E`.

### P1. `third-wave` smoke убивает игрока до конца сценария

Симптом: `SMOKE_SCENARIO=third-wave npm run smoke` проходит title/start/inventory, телепорт в Maintenance, slime/sample route и force faction events, но затем состояние:

```txt
currentFloor=3
gameOver=true
playerAlive=false
playerHp=0
samosborActive=false
```

Из-за этого шаги `third-wave rare samosbor force` и `third-wave recovery return` не могут открыть debug menu.

Что сделать:

- В third-wave smoke включать стабилизацию игрока до force faction event, как это уже сделано для некоторых debug recovery путей.
- Либо отделить dangerous faction-event smoke от rare-samosbor smoke в разные сценарии.
- Добавить явную проверку `playerAlive` после каждого force-event шага и понятное сообщение, что именно убило игрока.

### P2. Стартовый хаб сразу заливает игрока боевым логом

Через первые секунды после старта верхний лог уже заполнен убийствами и ранениями NPC. Атмосфера живая, но для первого экрана это шумит сильнее, чем помогает: игрок еще не понял цель, а журнал уже конкурирует с HUD и сценой.

Что сделать:

- На первые 30-60 секунд или пока игрок не покинул актовый зал приглушить дальние faction kill сообщения.
- Разделить личные события рядом с игроком и глобальный симуляционный шум.
- Для новых игроков первым сообщением дать короткий actionable lead: с кем поговорить, где оружие/припасы, где ближайший лифт.

### P2. `M` работает как трехпозиционный цикл, но выглядит как обычный toggle

Фактически `M` делает `mapMode = (mapMode + 1) % 3`: off -> minimap -> full map -> off (`src/main.ts:690-692`). В title/hints это читается как `M — карта` или `[M] закрыть`. Во время теста второе нажатие не закрыло карту, а открыло full map, из-за чего дальнейшие floor screenshots были перекрыты картой.

Что сделать:

- Явно писать `M — миникарта/карта/выкл`.
- Или сделать `M` обычным toggle, а full map вынести на удержание `M`, `Tab`, или отдельную клавишу.
- В smoke/playtest перед переходами принудительно сбрасывать `mapMode = 0`.

### P2. Headless/SwiftShader performance нестабилен

Стандартный smoke на headless SwiftShader прошел, но 180-frame telemetry показала `avg 24.68ms`, `p95 41.60ms`, `max 84.00ms`. Expedition smoke был лучше: `avg 19.31ms`, `p95 25.50ms`, `max 34.10ms`.

Это не равно реальному GPU performance, потому что тест работает через software rendering и делает readback, но риск для слабых окружений есть.

Что сделать:

- Добавить отдельный perf smoke без screenshot/readPixels во время измеряемого интервала.
- Логировать floor/entity counts вместе с frame telemetry.
- Держать отдельные thresholds для software/headless и real-browser ручного smoke.

### P3. Quest panel в пустом состоянии слишком пассивен

Панель заданий показывает `Нет заданий. Поговорите с жителями [E].` и большой пустой прямоугольник. Это функционально, но для нового игрока не хватает ближайшей цели.

Что сделать:

- В пустом quest log показывать 1-2 ближайших известных NPC/POI из стартового хаба: Ольга, оружейка Барни, лаборатория Якова, пункт вылазки.
- Не превращать это в tutorial wall; достаточно короткой строки маршрута/наводки.

### P3. QA/debug состояние недостаточно наблюдаемо

`window.__gigahrushSmokeState` полезен, но не включает `showNpcMenu`, `mapMode`, `current z/designFloorId/procedural key`, активный modal и текущий room/zone. Из-за этого smoke failures выглядят как "debug не открылся", хотя реальная причина может быть NPC menu или full map overlay.

Что сделать:

- Расширить smoke state: `showNpcMenu`, `showContainerMenu`, `showFactions`, `showLog`, `mapMode`, `floorZ`, `designFloorId`, `proceduralFloorKey`, `roomName`.
- Добавить debug command API только для smoke, чтобы тесты могли вызывать команды без навигации по overlay.
- После каждого browser step сохранять compact state в output.

## Что улучшить или добавить

1. Исправить закрытие NPC menu и post-transition input clearing. Это главный blocker для ручного и автоматического прохода этажей.
2. Переразвести smoke-сценарии: базовая живучесть, expedition, dangerous faction events, rare samosbor, all-floor visual pass.
3. Добавить all-floor visual smoke после фикса NPC menu: 6 story floors, 60 procedural slots выборочно по anomaly/geometry, 15 authored design floors.
4. Улучшить первый экран после старта: меньше глобального боевого шума, больше локального направления.
5. Уточнить управление картой и закрытием меню во всех HUD-панелях.
6. Добавить "новичковый маршрут" без тяжелого tutorial: поговорить с NPC, взять припасы, найти лифт, пережить первый короткий конфликт.
7. Для QA добавить stable test kit: бессмертие, weapon kit, clear modals, close all panels, reset map, teleport by id.

## Общий вывод

Проект собирается и базово играется: typecheck/tests/audit/build чистые, стандартный и expedition smoke проходят. Главные проблемы сейчас не в падении билда, а в UX/input state: NPC menu не закрывается с главной вкладки, interact может протекать через переходы, а dangerous smoke может убить игрока до завершения сценария. После фикса этих трех мест можно нормально прогнать полный authored/procedural floor visual pass и уже глубже смотреть баланс, читаемость и progression.
