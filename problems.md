# Problems Audit

> Центральный документ проблемных механик.
>
> Роль: здесь остаются только актуальные проблемы, которые уже существуют в коде и еще не встроены чисто в один центральный системный документ. Закрытые правки, журналы проходов, списки архивов и отчеты проверок сюда не добавляются.

Актуально на 2026-06-08. Фокус файла: текущие системные долги, которые создают частные связи между `core`, `data`, `gen`, `systems`, `render`, сохранениями, квестами, A-Life и UI.

## Правило ведения

Каждый пункт должен содержать:

- текущий симптом в коде или поведении;
- почему это системная проблема, а не разовая косметика;
- критерий закрытия, который можно проверить тестом, аудитом или browser-check.

Не хранить здесь:

- закрытые пункты;
- пересказы `audit_N`, `fixes_N` и командных логов;
- архивные пути;
- списки уже прошедших проверок;
- обещания будущих систем без наблюдаемого текущего симптома.

## Активные проблемы

| Область | Текущий симптом | Критерий закрытия |
| --- | --- | --- |
| Core/data/render ownership | В `core` и broad AI еще видны content-specific расширения, а render-side sprite generation может влиять на monster definitions/readability. Это смешивает владельцев данных, генерации и отображения. | Sprite/readability выводятся из data/helper path без render side effects; content-specific core формы удалены или явно закреплены как generic contract в `architecture.md`. |
| Save/load current shape | Quest target markers, restored floor-memory entity blobs и отдельные A-Life/mobility subsection versions требуют более узких current-version sanitizer tests. Риск: битая current-shape запись возвращает невозможные runtime факты. | Тесты покрывают round-trip quest markers, oversized floor-memory entities и wrong subsection versions. Старые формы отклоняются без migration scaffolding. |
| Quest target truth | Kill/fetch/contract/runtime target matching местами опирается на неполную цель, длинный `desc`, display-name context или implicit recipe policy. Риск: квест засчитывается не той смертью/предметом/комнатой или становится недостижимым. | Общие helpers для kill target matching и compact event target names; stable tags вместо русских display-name проверок; production tests доказывают reachable runtime recipe policy. |
| A-Life and Demos fairness | Материализация, arrivals/departures и Demos author selection еще нуждаются в защите от storage-order/prefix bias. Риск: порядок массива становится социальным или миграционным правилом. | Deterministic tests с перемешанным storage order доказывают одинаковый класс результата без зависимости от первого префикса массива. |
| Net Sphere public boundary | Server ownership, event/market budgets и публичные payloads еще требуют жесткой проверки: клиент не должен быть источником прав собственности, лимитов или раскрытия топологии. | Worker/runtime tests отклоняют forged ownership, over-budget events/markets и public profile payloads с implementation topology. |
| Combat/AI consequences | Path failure, last-known targets, stimulus propagation, projectile/AoE ownership consequences, corpse lookup и tactic assignment все еще требуют одного связного combat-AI pass. | Entity-index/cadence tests показывают spatial target/corpse choice, ally/witness stimulus and relation consequences for NPC-owned damage. |
| Monsters/ecology/generation truth | Design-floor `monsterBiasKinds` может ссылаться на редких или zero-weight monsters, rumor unlocks дублируют ecology data, base-floor spawn stats требуют audit against `MONSTERS`. | Static generation audit ловит unreachable bias kinds or marks them authored-only; runtime event tests emit ecology rumor ids; generation tests prove stats derive from definitions plus declared multipliers. |
| Render/UI performance boundaries | Visible sprite cap применяется до camera culling; full-map base raster может перерисовываться while WebGL keeps rendering; surface-mark overflow and door-state uploads need proportional dirty paths. | Pure culling/cache/dirty tests плюс `check:browser` сценарии для mesh high/off, map legend and damage-over-map. |
| Mobile interaction | Mobile menu accept, map legend, fullscreen/direct-page behavior and Net Sphere touch path остаются отдельным UX-risk cluster. | Browser/mobile smoke covers menu selection, legend readability, fullscreen availability and touch path without desktop-only assumptions. |
| Validation gates | Generation/mobile gates and build-size enforcement are not uniformly wired into default broad checks. Риск: regressions survive because the right command is optional or content-specific smoke owns generic reachability. | Named generation/mobile/size gates exist or docs state exact release owner; content wiring lives in `content:audit`, not ad hoc smoke logic. |
| Human speed source of truth | После пересадки в обычного NPC runtime нормализует human movement, но старые NPC `speed` literals remain in constructors/templates. Риск: новые gameplay-visible paths снова начнут читать raw speed as truth. | Decide whether NPC `Entity.speed` is gameplay-authoritative, status-derived or monster/projectile-only. Add audit/test that rejects new raw NPC movement speed without AGI/status reason. |
| Mesh draw radius vs pop-in | Меши (стены, предметы) пропадают или возникают из ниоткуда при движении камеры. Увеличение общего радиуса рендера приводит к падению FPS из-за лимита энтити/вокселей. | Развязать радиус culling/draw мешей от тяжелых запросов энтити (`queryRadiusCapped`), обеспечив отрисовку до границы тумана без просадки производительности. |
| Tutorial room isolation | Стартовый блок (Актовый зал, столовая, туалет) изолируется костыльно: `ensureConnectivity` и `carveCorridor` сначала прорубают к ним коридоры и двери, а затем в `index.ts` эти двери принудительно удаляются и заменяются глухими стенами, оставляя обрезанные тупиковые коридоры снаружи. | Переписать логику генерации стартового блока (например, улучшить поддержку `sealed=true`), чтобы изолированные комнаты элегантно игнорировались системами пробивки коридоров и дверей, не создавая мусорную геометрию, которую нужно отрезать пост-обработкой. |
## Запрещенные классы ошибок

### Stable Prefix Bias

Bounded scan не должен брать стабильный первый кусок живого массива, если порядок массива не является authored priority. Иначе очередь хранения начинает управлять физикой, AI, A-Life, миграциями, экономикой или квестами.

Пример класса: routine targeting смотрит первые `N` комнат или акторов и тем самым синхронизирует NPC в одну сторону; arrival anchors берут первый cached lift; faction/economy picker режет `.slice(0, cap)` before scoring/randomization.

Допустимые формы:

- actor-local cursor;
- deterministic offset salted by actor/floor/run id;
- spatial query before cap;
- score all candidates before top-N truncation;
- explicit authored priority documented in data.

### Map As Message Bus

Карта не должна быть лентой внутренних сообщений. На карте допустимы базовая геометрия, fog-of-war, лифты, игрок, обычные entity dots, квестовые NPC/room/item/kill markers и surface-map marks.

Не выводить на карту raw ids, route keys, event names, таймеры, caravan statuses, samosbor internals, Demos labels или технические фазы. Эти факты должны жить в HUD, журнале, слухах, диалогах, системных сообщениях или в самой сцене.

### Cross-Layer Side Effects

`render/` читает состояние и рисует. Он не должен создавать gameplay facts, мутировать data definitions или решать доступность механики. Аналогично `core/` не должен становиться складом частных content branches, если факт можно выразить data registry, event id, room tag, faction id or system helper.

Критерий: владелец состояния находится в одном слое, остальные слои получают компактный id/fact через существующий канал.
