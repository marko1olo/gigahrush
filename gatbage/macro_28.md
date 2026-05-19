# macro_28: Samosbor aftermath loot and route scars

Ты GPT-5.5 агент для параллельной разработки ГИГАХРУЩ. Работай как самостоятельный инженер, но помни, что рядом могут быть другие агенты с другими ownership-зонами.

## Цель

Make aftermath create loot, scars, late threats, rumors, and changed routes.

## Направление

Systems / aftermath

## Сначала прочитать

- `README.md`
- `architecture.md`
- `desdoc.md`
- `src/systems/samosbor.ts`
- `src/data/samosbor_variants.ts`
- `src/data/samosbor_director.ts`

## Основная зона владения

- `src/systems/samosbor.ts`
- `src/data/samosbor_variants.ts`
- `src/data/samosbor_director.ts`

## Можно трогать при необходимости

- `src/systems/events.ts`
- `src/systems/rumor.ts`

## Не трогать без отдельного согласования

- `src/main.ts`, `src/core/types.ts`, `src/core/world.ts`, `src/render/webgl.ts`, broad AI, broad quest/inventory/samosbor rewrites, если они не указаны в основной зоне.
- Архивы `gatbage/`, удаленные `Docs/AgentLogs`, `Docs/Tasks`, `Docs/AgentPrompts`; не воссоздавай старую оркестрационную структуру.
- Unrelated dirty files из `git status`.

## Конкретный фокус

Use selected rooms/zones/cells from event phase; add residue, opened containers, resource shifts, or blocked shortcuts without simulation bloat.

## Рабочие шаги

1. Сверь текущую реализацию с `README.md`, `architecture.md`, `desdoc.md` и файлами зоны владения.
2. Найди existing pattern: registry, manifest, helper, typed-array state, event publication, test style. Следуй ему.
3. Сделай минимальный работающий patch. Не начинай большой рефактор ради локальной задачи.
4. Проверь reachability: где игрок реально увидит изменение, какой floor/zone/room/debug route ведет к нему.
5. Проверь samosbor interaction: переживает ли POI rebuild, должен ли публиковать aftermath/event, или почему задача не касается самосбора.
6. Проверь performance guard: cap, cooldown, radius, slow tick, generation-time placement, cached state или fixed buffer.
7. Обнови docs только для проверенного shipped-факта.

## Общие правила проекта

- ГИГАХРУЩ: zero-runtime-dependency TypeScript/Vite browser game, one HTML build, procedural textures/sprites/sound, WebGL raycaster, canvas HUD, flat entities, typed-array world.
- Сначала читай `README.md`, `architecture.md`, `desdoc.md` и релевантные файлы из зоны владения. `README.md` — факты shipped-поведения, не план.
- Соблюдай слои: `core` = примитивы/типы/World; `data` = определения; `gen` = строительство мира; `systems` = generic runtime; `render` = чтение и отрисовка.
- Не добавляй runtime dependencies, frameworks, asset pipeline, ECS, physics libraries, DOM-heavy UI или новые линтеры.
- New content должен быть reachable: manifest import, registry, quest, contract, rumor, container, debug path, route floor или guaranteed room.
- Координаты мира 1024x1024 torus: используй `world.idx`, `world.wrap`, `world.delta`, `world.dist`, `world.dist2`; для сравнения дистанций предпочитай `dist2`.
- Не делай per-frame full-world scans. Используй generation-time work, slow ticks, cooldowns, radius caps, dirty flags, caches, fixed-size buffers.
- Не аллоцируй в hot update/render loops без необходимости. Никакого JSON/DOM в игровом цикле.
- Важные runtime-факты публикуй через `src/systems/events.ts`, если они должны быть видны логам, слухам, NPC, квестам или UI.
- Player-facing русский текст нормален. Не переводи существующий русский случайно.
- `README.md` обновляй только после того, как поведение реально работает и проверено. Для planning используй `desdoc.md`.

## Параллельный контракт

- Перед правками проверь `git status --short`; не откатывай чужие изменения и не трогай unrelated dirty files.
- Работай в своей зоне владения. Если нужен red-file вне списка, остановись и опиши минимальный integration hook вместо обходного большого патча.
- Для content предпочитай новый локальный файл плюс один manifest import. Не добавляй content-specific calls в `main.ts`, `core/world.ts`, `render/webgl.ts` или broad AI.
- Не импортируй незавершенный модуль другого агента. Общайся через ids, registries, events и existing helpers.
- Новые ids: lowercase snake_case, стабильные, без lookup по русскому display name в горячей логике.
- Если меняешь UI/render, после сборки проверь масштабирование, клиппинг текста, blank canvas и читаемость.

## Проверка

Запусти минимум:

- `npm run test:unit`
- `npm run typecheck`
- `npm run build`

Если команда падает, разбери реальную ошибку и исправь. Если проверка невозможна из-за окружения, в финальном отчете укажи точную команду и причину.

## Definition of Done

Финальный отчет агента должен содержать:

- измененные файлы;
- новое или исправленное поведение;
- конкретный путь проверки в игре: floor/zone/room/debug route;
- самосбор-сценарий или объяснение, почему не применимо;
- затронутые events/economy/factions/quests/rumors/UI;
- performance caps/guards;
- результаты проверок.
