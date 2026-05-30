# Система пакетов монстров

> Центральный документ монстров.
>
> Роль: описывает monster packages, procedural sprites, ecology, simple AI, special tactic profiles, counterplay and scaling rules for thousands-capable active floors. Связан с `fight.md`, `ai.md`, `items.md` and `balance.md`.

Актуально на 2026-05-30. Это активный root-док по монстрам: не архив prompt-файлов и не список отдельных заявок. Старые подробные monster bible/prompt-аудиты остаются в `gatbage/` только как исторический материал; реализация проверяется по `src/entities/`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/systems/ai/tactics.ts`, `src/render/sprite_index.ts` и `src/render/sprites.ts`.

## Что такое пакет монстра

Монстр - это маленький data/code package, а не класс и не отдельная подсистема. Минимальный пакет содержит:

- `src/entities/<id>.ts` с `DEF: MonsterDef`;
- процедурный `generateSprite()` для sprite sheet;
- регистрацию в `src/entities/monster.ts`;
- ecology entry в `src/data/monster_ecology.ts`;
- при необходимости aiFlags или generic tactic hook;
- counterplay, rumor/event cues и редкий loot/corpse hint, если игрок должен научиться правилу.

Сейчас `MONSTERS` и `MONSTER_ECOLOGY` покрывают 67 monster kinds. Sprite indices вычисляются автоматически через `src/render/sprite_index.ts`; `generateSprites()` присваивает indices на старте, поэтому spawn-код не должен хранить магические sprite numbers.

## Базовая модель

`MonsterDef` хранит kind, name, HP, speed, damage, attackRate, sprite, ranged/projectile fields, aiFlags, floors, counterplay, lootHint and optional boss readability. Большинство монстров должны выражаться этими полями плюс shared AI.

`src/data/monster_ecology.ts` задает spawn identity: floors, rooms, weights, rare flag, samosbor count, route pressure, room/floor fit, cue, rule, counterplay, death-log hint, rumors and rare drops. Генераторы выбирают monster kind через ecology/bias, а не через русские имена или частные списки в render.

## AI и тактика

Основной runtime - full-pass active-floor AI. Каждый live NPC/monster на текущем этаже получает AI pass; производительность держится за счет entity index, cached target ids, scan cooldowns, local caps, flow/path fields и actor-local timers, а не за счет player spawn bubble.

Простое поведение монстров живет в `src/systems/ai/monster.ts`: цель, движение, melee/ranged attack, projectile, windup/counterplay, damage events, death consequences. `aiFlags` включают небольшие generic variations: wall bias, food bait, water line, document scent, light lock, fog offset, source swarm, parasite leader, rooted plant, false patrol, pack howl and similar cheap rules.

Если флагов недостаточно, добавляется bounded tactic profile в `src/systems/ai/tactics.ts` или узкий generic system. Такой профиль обязан иметь sense radius, scan cap, sense interval, cooldowns and no per-actor global search. Пример текущего подхода - `slime_woman`: cached facts, capped nearby scans, wet/dry anchors, timed residue and flee/ambush phases.

## Масштаб

Игра должна выдерживать тысячи простых монстров и NPC на активном этаже. Поэтому новый monster package не должен:

- запускать BFS для каждого актора каждый кадр;
- сканировать все `entities` или весь `World`;
- аллоцировать closures/arrays в hot loop без shared scratch;
- хранить unbounded per-monster logs;
- делать DOM/UI work;
- требовать уникальную render path для обычного поведения.

Сложный монстр допускается, если его сложность локальна, редка, capped и дает сильное решение игроку. Массовые монстры должны быть дешевыми: простые stats, один-два flags, readable cue, counterplay через позицию/свет/шум/дверь/приманку/оружие.

## Counterplay

Монстр считается готовым, когда игрок может понять ошибку и ответ:

- warning cue до урона: звук, след, sprite posture, mark, local log, light/fog/door behavior;
- правило боя: где он силен и где слаб;
- ресурсный ответ: патроны, свет, огонь, герметик, соль, bait, документ, вода, дверь, инструмент;
- consequence: событие, слух, редкий drop, room mark, corpse/source state or quest hook;
- death/fail wording, если причина смерти неочевидна.

HP-only и sprite-only additions не проходят. Уникальное имя encounter можно выразить существующим `MonsterKind`, room state, marks, events and local content; новый `MonsterKind` нужен только для reusable base creature with distinct rules.

## Добавление нового monster kind

1. Проверить, нельзя ли выразить идею существующим kind + ecology/room/event.
2. Добавить enum только если нужен новый reusable base kind.
3. Создать `src/entities/<id>.ts` с DEF и procedural sprite.
4. Зарегистрировать DEF/sprite in `src/entities/monster.ts`.
5. Добавить ecology entry: floors, rooms, weight, rare/minSamosbor, counterplay, rumors, rare drops.
6. Использовать existing aiFlags; новый AI hook делать generic and bounded.
7. Добавить test/debug path, если монстр меняет topology, status, projectile, source nest or special counterplay.

Новые монстры не должны добавлять content-specific logic in `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI orchestration.
