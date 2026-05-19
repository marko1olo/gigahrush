# economics_3.md — НЕТ-терминалы как доступ к счету

## Роль

Ты GPT-5.5 worker. Ты не один в кодовой базе: учитывай, что banking API из `economics_2.md` и map editor / НЕТ-ГЕН уже могут меняться другими агентами. Не откатывай их правки.

## Цель

Сделать НЕТ-терминалы экономически полезными и частыми: на каждом этаже должно быть минимум 16 терминалов, через них можно класть и снимать рубли со счета даже без НЕТ-ТЕРМИНАЛ ГЕН. НЕТ-ГЕН по-прежнему нужен для map editor / текущего GEN-доступа.

## Текущий факт

- Терминалы описаны в `src/data/net_terminal_gen.ts`.
- Сейчас normal placement максимум 2 терминала, count weights часто дают 0.
- `src/systems/net_terminal_gen.ts` хранит registry терминалов на текущем этаже.
- `tryUseNetTerminalGen()` сейчас:
  - с GEN открывает map editor;
  - без GEN показывает denied overlay.
- `main.ts` после успешного GEN открывает `openMapEditor()`.
- `render/net_terminal_gen_ui.ts` рисует denied screen.

## Dependencies

Ожидается API из `economics_2.md`:

- `ensureBankingState`
- `cashToAccount`
- `accountToCash`
- `bankingSummary`

Если этот API еще не смержен, реализуй задачу поверх маленького local adapter с теми же именами и явно отметь TODO в финальном отчете. Не создавай второй несовместимый banking state.

## Ownership

Основные файлы:

- `src/data/net_terminal_gen.ts`
- `src/systems/net_terminal_gen.ts`
- новый `src/render/net_terminal_bank_ui.ts` или расширение `src/render/net_terminal_gen_ui.ts`
- `tests/net-terminal-economy.test.ts`

Интеграционные файлы:

- `src/main.ts` только для routing interact/open/close/input терминального банковского overlay.
- `src/render/hud.ts` только для вызова нового terminal-bank renderer.

Не трогай:

- `src/render/net_sphere_ui.ts`
- `functions/api/net/*`
- `cloudflare/d1/*`
- stock market файлы.

## Требования

1. Placement:
   - Сделай normal terminal placement минимум 16 на текущий этаж.
   - Используй существующий candidate search, но увеличь attempts/caps разумно.
   - Терминалы не должны попадать в `aptMask`, hermoWall, door/lift/abyss, и должны иметь adjacent passable cell.
   - Debug placement может остаться отдельным, но не должен уменьшать normal target.

2. Access split:
   - Без GEN terminal не должен быть просто отказом.
   - Без GEN открывается банковский терминал: счет, внести, снять.
   - С GEN открывается расширенное меню или сохраняется старый путь к map editor.
   - Denied overlay можно оставить для map-editor access: текст должен объяснять, что счет доступен, GEN-доступ нет.

3. Banking terminal controls:
   - Минимум:
     - `E` или `Enter`: внести/снять выбранную сумму.
     - `W/S`: выбрать действие.
     - `A/D`: изменить сумму preset.
     - `Esc`/`Enter` close по локальному паттерну проекта.
   - Presets: 10, 50, 100, all possible.
   - Все операции должны идти через banking API.

4. UI:
   - Canvas overlay, не DOM.
   - Покажи:
     - наличные;
     - счет;
     - депозит;
     - долг;
     - выбранное действие/сумму.
   - Следи за scaling: текст не должен вылезать на мобильном.

5. Events/messages:
   - Сообщения в `state.msgs`: короткие, русские.
   - Banking API должен публиковать события; если он этого не делает, не дублируй слишком много событий в terminal layer.

## Acceptance

- На обычном этаже после generation registry содержит не меньше 16 terminal entries, если есть достаточно клеток.
- Подход к терминалу без GEN открывает банковский overlay, не denied-only экран.
- Внести наличные на счет через терминал можно.
- Снять со счета в наличные через терминал можно.
- С GEN старый путь к map editor не сломан.
- Save/load не теряет registry behavior после transition/replay.

## Проверки

Минимум:

```bash
npm run typecheck
npm run test:unit -- tests/net-terminal-economy.test.ts
```

Так как это UI/render/input:

```bash
npm run check
```

Вручную или smoke: проверь, что overlay не пустой и не клиппит текст.

