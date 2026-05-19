# economics_4.md — банковский этаж, кассы и кредитный риск

## Роль

Ты GPT-5.5 worker. Это design-floor/integration task. Ты не один в кодовой базе: файлы route manifest могут быть грязными от других задач, не откатывай их и минимизируй конфликтные правки.

## Цель

Добавить reachable банковский этаж, где игрок явно видит смысл денег: кассы, депозитные окна, кредитный стол, хранилище, должники, охрана и выборы украсть/внести/занять/погасить/сдать фальшивую бумагу.

## Текущий факт

- Routed design floors задаются в `src/data/design_floors.ts`.
- Генераторы живут в `src/gen/design_floors/*.ts`.
- Manifest: `src/gen/design_floors/manifest.ts`.
- Full 1024x1024 expansion: `src/gen/design_floors/full_floor.ts`.
- Сейчас банковского design floor нет.
- Banking API должен прийти из `economics_2.md`.

## Ownership

Основные новые файлы:

- `src/gen/design_floors/bank_floor.ts`
- `tests/bank-floor.test.ts`

Интеграционные файлы:

- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`
- `src/gen/design_floors/full_floor.ts`
- `tests/procedural-floors.test.ts` или отдельный route test.

Не трогай:

- `src/core/types.ts`
- `src/render/webgl.ts`
- `src/systems/banking.ts` кроме импорта публичного API.
- `src/systems/net_terminal_gen.ts`.

## Требования

1. Route:
   - Добавь `bank_floor` как authored route stop.
   - Размести z так, чтобы не конфликтовать с текущими route stops. Если свободного route slot нет, используй процедурный gap и обнови tests/README только после фактической интеграции.
   - Display name: `Банковский этаж` или более атмосферно, но ясно.
   - Base floor лучше `MINISTRY` или `KVARTIRY`; выбери и обоснуй в комментарии/debug data.

2. Geometry:
   - Большой зал касс.
   - Кредитное окно.
   - Депозитный ряд.
   - Хранилище с сейфами/cashbox containers.
   - Очередь должников.
   - Служебный обход/черный ход для воровского решения.
   - Все комнаты должны быть reachable, двери sane, без sealed dead-end.

3. NPC:
   - Управляющий банка.
   - Кассир.
   - Кредитный инспектор.
   - Охрана/ликвидатор.
   - Должник/курьер.
   - NPC имеют `money`, inventory, faction/occupation и короткие русские talk lines.

4. Interactions:
   - Через side quests или local interaction:
     - внести депозит;
     - взять кредит;
     - погасить кредит;
     - украсть из cashbox/vault;
     - сдать/подделать долговую бумагу.
   - Не добавляй банковскую механику напрямую в generator, если есть API из `systems/banking.ts`; generator должен быть content/entry surface.

5. Content consequences:
   - Кража из хранилища публикует theft/container events через existing containers.
   - Кредитные действия публикуют banking tags/events.
   - Невыплаченный долг должен быть видим хотя бы через banking summary или quest/log.

## Acceptance

- `bank_floor` reachable через normal route/debug teleport.
- На этаже есть минимум 4 named banking rooms и минимум 4 NPC.
- Можно совершить хотя бы одну банковскую операцию на этаже через existing UI/path.
- Есть выбор риска: легальная операция и кража/фальшивый путь.
- Tests проверяют route registration, generator non-empty rooms, spawn point passable, key rooms present.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/bank-floor.test.ts
npm run check
```

После render/UI изменений или если добавил route:

```bash
npm run smoke
```

