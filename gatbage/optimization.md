# Optimization Audit

Дата: 2026-05-17
Основа: `README.md`, `desdoc.md`, фактический код `src/`.
Статус: выполнены безопасные runtime-оптимизации без изменения игровых правил, контента, управления, сохранений или визуального результата.

## Фактический профиль проекта

- TypeScript/Vite, singlefile build.
- Мир 1024x1024, WebGL2 DDA-raycaster, процедурные текстуры и спрайты.
- Горячие runtime-зоны: `src/main.ts`, `src/render/webgl.ts`, `src/systems/ai/*`, `src/systems/samosbor.ts`, `src/render/hud.ts`, `src/render/map_ui.ts`.
- Базовая сборка до правок: `npm run build` проходила.
- Сборка после правок: `npm run build` проходит.

## Выполнено

### 1. Убраны лишние full-texture uploads в WebGL

Файлы:
- `src/core/world.ts`
- `src/render/webgl.ts`
- `src/main.ts`
- `src/systems/samosbor.ts`

Что было:
- `updateDynamicData()` каждый кадр загружал полные 1024x1024 `wallTex`, `fog` и `doorStates`.
- Это давало постоянный CPU-to-GPU traffic даже в спокойном кадре без изменения стен, пола, тумана или дверей.

Что сделано:
- Добавлены dirty-версии `wallTexVersion`, `floorTexVersion`, `fogVersion`.
- `wallTex`, `floorTex`, `fog` грузятся только при изменении версии.
- Door states теперь сравниваются с кешированным byte-buffer и грузятся только если изменился хотя бы один door state.
- Строительство двери/стены вызывает full world upload сразу после структурного изменения, чтобы renderer не отставал от gameplay grid.

Оценка:
- Спокойный кадр экономит до 2-3 MB/frame лишней передачи данных плюс 1 MB fill door-state buffer.
- Ожидаемо: около 50-200 us/frame на слабом GPU/CPU path, зависит от браузера и драйвера.

### 2. Убрана per-frame Map allocation в AI

Файл:
- `src/systems/ai/index.ts`

Что было:
- `updateAI()` каждый кадр создавал новый `Map<number, Entity>` для lookup по id.

Что сделано:
- Введен module-level cache `entityByIdCache`.
- Каждый кадр карта очищается и заполняется заново без создания нового объекта.

Оценка:
- Меньше GC pressure при 1000+ NPC/monster/entity.
- Экономия мала в одиночном кадре, но снижает вероятность GC spikes.

### 3. Убраны object allocations в visible sprite pass

Файл:
- `src/render/webgl.ts`

Что было:
- Для каждого видимого entity создавался объект `{ e, dx, dy, dist }` перед сортировкой спрайтов.

Что сделано:
- Заменено на переиспользуемые parallel arrays: entity, dx, dy, dist, order.
- Сортируется только массив индексов.

Оценка:
- Устраняет object churn в renderer hot path.
- Польза растет с числом NPC/монстров/декораций в кадре.

### 4. Убран случайный combat scan interval из per-entity hot path

Файлы:
- `src/systems/ai/monster.ts`
- `src/systems/ai/combat.ts`

Что было:
- Части combat AI создавали `Math.random()` scan interval в runtime update path.

Что сделано:
- Добавлен deterministic per-entity jitter через hash от `entity.id`.
- Сканирование осталось размазанным по времени, но без лишнего RNG churn.

Оценка:
- Поведение остается предсказуемым и staggered.
- Убирает мелкий CPU шум в плотных боях.

### 5. Убраны лишние sqrt в HUD/containers

Файлы:
- `src/render/hud.ts`
- `src/systems/containers.ts`

Что было:
- Поиск ближайшего NPC для `[E]` prompt и проверка nearby containers использовали distance с `sqrt`.

Что сделано:
- Заменено на squared distance.

Оценка:
- Микрооптимизация, но находится в часто вызываемых UI/input путях.

### 6. Уменьшен overhead BFS-neighbor wrapping

Файл:
- `src/systems/ai/pathfinding.ts`

Что было:
- BFS для каждого соседа использовал modulo-wrap выражения.

Что сделано:
- Заменено на branch wrap для четырех направлений.

Оценка:
- Сохраняет тороидальную геометрию.
- Уменьшает стоимость pathfinding inner loop.

### 7. Контейнеры получили id lookup

Файлы:
- `src/core/world.ts`
- `src/systems/production.ts`

Что было:
- Некоторые container lookups шли через linear `.find()`.

Что сделано:
- Добавлен `containerById`.
- `outputContainer()` использует O(1) lookup.

Оценка:
- Низкий риск, полезно для production/economy growth.

## Намеренно отклонено в этом проходе

- Dirty rectangles/chunked texture uploads: быстрее, но требует дисциплины на всех write sites. Слишком легко сломать renderer при параллельной работе агентов.
- Spatial partition grid для AI target scan: правильно, но это изменение контракта combat/search behavior. Нужен отдельный тестовый проход.
- Sprite atlas + instanced sprite rendering: даст больше, но требует менять shader/data path. Не для safe pass.
- Minimap tile cache: возможен выигрыш, но туман, зоны, квесты и сущности делают invalidation нетривиальной.
- Save schema changes: не трогались.

## Следующий безопасный проход

1. Ввести coarse spatial buckets для entities только как read-only acceleration layer, без изменения AI решений.
2. Вынести repeated quest marker sets из minimap/HUD в frame cache.
3. Добавить частичные uploads для door-state texture по dirty door indices.
4. Профилировать `updateFactionCapture()` и `spawnTerritoryReinforcements()` на dense floors.
5. Добавить browser perf smoke: frame budget counter после 300 rendered frames.
