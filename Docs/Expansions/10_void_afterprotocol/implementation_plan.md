# Expansion 10 Implementation Plan: Void Afterprotocol

Версия: 0.1 planning  
Agent: EXP10_VOID  
Scope: playable MVP для `Docs/Expansions/10_void_afterprotocol/expansion.md`

## Authority And Constraints

`README.md` фиксирует уже реализованную игру: TypeScript/Vite, raycaster, тороидальный мир, A-Life, самосбор, world log, debug, сюжет через Якова, Майора, Ад, Вестников и `VOID`. `desdoc.md` задает направление: `VOID` является финальным абстрактным уровнем, Творец не обязан быть истиной, пост-финальная игра продолжается, а право менять законы зоны должно оставаться локальным. Root system docs и `Docs/Expansions/INDEX.md` требуют маленький playable slice, cheap-by-default системы, bounded state, debug visibility и запрет на глобальное отключение самосбора.

Expansion 10 нельзя внедрять как новый большой слой магии. Игрок получает поздний инструмент для локальной стабилизации, платит backlash и оставляет trace в мире. Все изменения должны быть additive: протоколы читают существующее состояние двери, комнаты, зоны, NPC, маршрута или документа; самосбор отвечает через локальный pending marker; старые системы не переписываются под новый канон.

Релевантные мандаты для будущей реализации: domain boundary, simultaneous execution через decoupled interfaces/events, cinematic cheat protocol, frame-time dictatorship 0.1 ms suspicion threshold, Math LOD low/middle/high/ultra, black-box bounded telemetry, factual source separation between README and planning docs, additive integration over refactoring loops.

## MVP Thesis

Playable MVP считается настоящим только если у игрока есть полный цикл: поздний доступ к протоколу, выбор anchor, применение к локальной цели, видимый полезный эффект, delayed backlash на следующем самосборе или ближайшем событии, запись trace в world log/debug и реакция хотя бы одного NPC/голоса. Комната в `VOID` без этого цикла не является MVP.

Первый протокол для vertical slice: `seal_seam`. Он закрепляет одну гермодверь или один door-cell на следующий самосбор, но деградирует ближайший альтернативный проход или повышает риск тишины сирены в той же зоне. Это не отменяет самосбор. Это покупает одну понятную локальную победу.

## Phase 0: Audit And Hooks

Цель фазы - подготовить будущую реализацию без редизайна самосбора. Разработчик должен подтвердить реальные имена типов и API в `src/core/types.ts`, `src/systems/samosbor.ts`, `src/systems/world_log.ts`, `src/systems/debug.ts`, `src/data/plot.ts` и коде `VOID` генерации. Если world log или event bus уже имеют production API, protocol trace обязан использовать его. Если нет, MVP допускает локальный bounded buffer внутри `systems/void_protocols.ts` с адаптером к `state.msgLog`.

DOD фазы: перечислены существующие точки подключения, выбран один event/trace путь, нет правок save-схемы без миграции, нет прямой зависимости на будущие expansion-системы. Проверка: `npm run build`, debug-open игры, существующий самосбор проходит без протоколов с прежним поведением.

Риск фазы: агент начнет чистить старые сообщения или переписывать `samosbor.ts`. Запрет: любые изменения самосбора должны быть минимальными hook-чтениями вида "есть ли локальный marker на этой двери/зоне", без переноса основной логики.

## Phase 1: Data Definitions

Создать data-driven `VoidProtocolDef` и стартовый каталог из трех протоколов: `seal_seam`, `restore_record`, `tenant_memory`. MVP полностью реализует `seal_seam`, остальные два могут быть доступными только через debug/content preview, если не хватает старых систем архива и NPC memory.

Тип должен описывать не строковое заклинание, а контракт применения: допустимые `anchorTags`, `targetScope`, cost, cooldown, effect kind, backlash kind, trace severity, UI/debug name. У каждого протокола должен быть stable id. Никаких произвольных callback-строк в data-файле.

DOD фазы: catalog импортируется без side effects, минимум 3 defs проходят typecheck, `seal_seam` имеет валидный target validator, каждый def имеет backlash и trace config. Проверка: unit-style pure validation через существующий test/build pipeline или временный debug command, если тестов нет.

Риск фазы: протоколы станут списком лора. Контрмера: каждый def должен отвечать на "какой объект меняется", "когда откатывается или отвечает самосбор", "что игрок увидит".

## Phase 2: Protocol Chamber In VOID

MVP-узел в `VOID` должен быть маленькой процедурной комнатой или pocket-room: белый коридор, отсутствующий кабинет, журнал П-46, один голос и технический терминал. Он выдает один протокол после позднего сюжетного gate: Вестники/Творец/Яков after-final flag. Если сюжетного gate еще нет в коде, debug-команда должна выдавать протокол без подмены сюжетной цепочки.

Комната не должна объяснять природу самосбора. Текст формулируется как неполная инструкция: "закрепить шов", "указать anchor", "не считать тишину ошибкой". Визуальный эффект делается дешево: палитра, исчезающие wall slices, ghost overlay, повтор UI-строк. Геометрическая логика остается обычной комнатой.

DOD фазы: игрок или debug получает `seal_seam`; журнал сообщает факт получения; повторное получение не дублирует протокол бесконечно; `VOID` остается доступным без нового permanent FloorLevel. Проверка: пройти в комнату или вызвать debug, открыть inventory/protocol list, сохранить/загрузить, убедиться в отсутствии дубликатов.

Риск фазы: `VOID` станет отдельной мини-игрой. Контрмера: MVP только выдает правило; применение происходит на бытовом этаже у реальной двери.

## Phase 3: Local Effect Resolver

`applyVoidProtocol(state, request)` должен быть единственной точкой применения. Resolver проверяет владение протоколом, cooldown, anchor, target scope, дистанцию до цели и текущий floor. После успеха он пишет `VoidProtocolMark` в bounded state: target key, protocol id, applied time, expiresAt или pendingSamosborCount, backlash state, trace id.

Для `seal_seam` mark привязывается к конкретной двери или room-door key. Во время следующего самосбора дверь получает повышенную надежность: меньше шанс заклинить, дольше держит туман или открывается после отбоя. Реальный коэффициент должен быть малым и понятным. Backlash выбирает ближайший route candidate в той же зоне и ставит `route_degraded` или `silent_warning` marker.

DOD фазы: применение невозможно без target, невозможно применить глобально к зоне на MVP, cooldown работает, backlash создается всегда, trace создается всегда. Проверка: попытка применить без цели, к стене, к NPC, к второй двери в cooldown, затем к валидной двери.

Риск фазы: resolver начнет изменять клетки мира напрямую без истории. Контрмера: сначала mark + trace, затем потребители читают mark в своих точках, а не скрытая мутация без объяснения.

## Phase 4: Samosbor Response

Самосбор не должен знать про весь каталог протоколов. Ему нужен узкий API: запросить локальные marks для двери/комнаты/зоны и сообщить факт "началась активная фаза", "дверь проверена", "зона перестроена", "самосбор закончился". `void_protocols.ts` на эти события решает, сработал effect или backlash.

Для MVP достаточно двух точек: при закрытии/проверке гермодверей учитывать `seal_seam`, при окончании самосбора активировать backlash. Если hook невозможен без риска, допустим delayed response через world event после самосбора: "соседний проход деградировал", "сирена в зоне пропала на следующий цикл".

DOD фазы: стабилизированная дверь дает читаемый результат во время самосбора, соседний ущерб появляется после или во время того же цикла, журнал связывает причину с протоколом. Проверка: debug force samosbor, наблюдать дверь, открыть latest events/debug protocol traces.

Риск фазы: игрок воспримет backlash как random bug. Контрмера: message/traces обязаны иметь protocol id, target, backlash kind и short public text.

## Phase 5: NPC And Voice Reactions

Яков остается ученым, Вестники остаются неполными, Творец остается локальным механизмом или имитацией. Реакции не должны превращать игрока в избранного. После первого применения один ближайший NPC или голос может отреагировать: благодарность, страх, подозрение, требование акта, отрицание.

Реакция использует существующий dialogue/context path. Если NPC memory есть, записать small personal fact: `void_protocol_seen`, `door_saved`, `player_changed_rule`. Если нет, реакция остается в world log и transient line. Сюжетные `talkLines` имеют приоритет.

DOD фазы: после применения есть хотя бы одна контекстная строка или log line; повторные строки дедуплицируются; NPC с критической потребностью не произносит лор вместо боли/голода/опасности. Проверка: поговорить с Яковом или ближайшим NPC после применения, затем повторить и проверить cooldown.

Риск фазы: лор вытеснит survival state. Контрмера: dialogue priority из `desdoc.md` сохраняется: опасность, боль, потребности, личная память, квест, слухи, профессия, фракция, лор.

## Phase 6: Debug, Telemetry And Save

Debug должен закрывать всю диагностику: выдать протокол, очистить cooldown, показать owned protocols, показать active marks, force backlash, force next samosbor, dump last traces. Black-box telemetry хранит последние 300 frames/high-level ticks протоколов: time, floor, zone, target key, protocol id hash, effect state, backlash state, samosbor phase, flags. Буфер фиксированный.

Save/load должен хранить только bounded protocol state: owned ids, cooldown timestamps, active marks, completed traces if needed. Старые сохранения нормализуются пустыми массивами. Никаких unbounded textual logs в save.

DOD фазы: debug выводит причины отказа, active marks не растут бесконечно, save/load сохраняет cooldown и pending backlash, impossible state или NaN может dump-ить `Docs/AgentLogs/Dump_EXP10_VOID.bin` в будущем implementation scope. Проверка: применить, сохранить, загрузить, force samosbor, прочитать debug state.

Риск фазы: debug станет единственным способом понять механику. Контрмера: debug подробный, но игрок получает короткий diegetic trace в журнале или голосе.

## Math LOD

Low tier: 1 playable protocol, 3-5 defs in catalog, manual application only, target scope `door` или `document`, scripted backlash, trace ring 64-128 entries, no ambient VOID simulation. Expected active resolver cost: 20-60 us per player command, 0 us per frame outside checks.

Middle tier: room/zone marks, cooldown UI, world log integration, one pocket/route interaction, 128-300 trace entries, backlash selected from small local candidate list. Expected event-response cost: 50-120 us on samosbor event, not every frame.

High tier: protocols react to previous expansions through registered adapters: archive fact, metro route, market debt, hospital card, school evacuation memory, industrial line. Adapters are optional and return "unsupported" if the expansion system is absent. Expected cost remains event-bound; expensive searches are capped.

Ultra tier: visual overkill in `VOID`: distorted UI, blank rooms, ghost overlays, impossible corridor masks, extra voice lines and trace inspection. Logic stays command/event-based. Ultra spends saved CPU/GPU budget on presentation, not on continuous metaphysical simulation.

## Test And Verification Matrix

Build verification: `npm run build` must pass after every implementation slice. If build fails, fix manually; after three failures caused by external dependency, revert only own broken chunk and mark blocked.

Functional checks: protocol cannot apply without ownership; invalid target fails with debug reason; valid target creates mark, cooldown, trace and HUD/log feedback; next samosbor consumes or updates mark; backlash appears and is traceable; save/load preserves pending state.

Performance checks: no per-frame scans over all doors, rooms, NPC or zones; candidate selection is local to target zone/room; trace buffers are fixed; debug formatting runs only on request; adapters are event-driven.

Regression checks: baseline samosbor without protocol behaves as before; `README.md` remains factual and untouched until code exists; old saves without protocol state load; story NPC hand-written lines remain priority.

## Release DOD

MVP is done when `seal_seam` can be obtained from late `VOID` or debug, applied to a real hermdoor/door target, visibly improves that target during the next samosbor, causes a readable backlash elsewhere, records structured trace, survives save/load and exposes debug state. At least two additional protocol defs must exist as data with validators or blocked adapters, but they do not need full gameplay before `seal_seam` is stable.
