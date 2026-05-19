# economics_1.md — ядро цен, спроса и торговой транзакции

## Роль

Ты GPT-5.5 worker. Ты не один в кодовой базе: не откатывай чужие изменения, не переписывай соседние системы и не трогай файлы вне своего ownership без крайней необходимости.

## Цель

Сделать рубли ощутимыми через более честную торговлю: цена должна зависеть не только от `ItemDef.value` и scarcity, но и от спроса этажа, роли торговца, buy/sell spread и простых тарифов. Одновременно нужно убрать дублированную buy/sell-логику из `main.ts` в маленький системный API, чтобы следующие агенты могли подключать банки, биржу и рынки без копипасты.

## Текущий факт

- Базовая цена предмета: `src/data/items.ts` -> `ItemDef.value`.
- Ресурсная группа предмета: `src/data/resources.ts` -> `resourceForItem()` / `resourceForItemType()`.
- Scarcity state: `src/data/economy.ts`, runtime API в `src/systems/economy.ts`.
- Цена сейчас: `getAdjustedItemPrice(state, defId)`.
- Покупка/продажа сейчас исполняется в `src/main.ts` в двух input paths и почти дублируется.
- Trade UI в `src/render/npc_ui.ts` только рисует цену и подсказку.

## Ownership

Основные файлы:

- `src/data/economy.ts`
- `src/systems/economy.ts`
- новый `src/data/economy_rules.ts`
- новый `src/systems/trade.ts`
- `tests/economy-trade.test.ts`

Разрешенный интеграционный файл:

- `src/main.ts` только для замены текущих buy/sell блоков на вызов `systems/trade.ts`.

Не трогай:

- `src/core/types.ts`
- `src/render/webgl.ts`
- `src/core/world.ts`
- banking / stock-market файлы других economics-задач.

## Требования

1. Добавь data-first правила спроса:
   - `EconomyDemandRule` или похожий тип с `resourceId`, `floor`, `multiplier`, `reason`.
   - Базовые профили:
     - `MINISTRY`: документы/бумага выше, медицина и еда умеренно.
     - `KVARTIRY`: вода, еда, медицина выше.
     - `LIVING`: сбалансировано, контрабанда и еда чуть выше.
     - `MAINTENANCE`: металл, tools, fuel, electronics выше.
     - `HELL`: медицина, psi, fuel выше.
     - `VOID`: psi, electronics, documents выше.
   - Не добавляй enum для design floors. Если нужен route/design контекст, используй string id/optional context.

2. Добавь quote API:
   - `getEconomyQuote(state, defId, opts)` должен возвращать:
     - `basePrice`
     - `scarcityMultiplier`
     - `demandMultiplier`
     - `tariffMultiplier`
     - `buyPrice`
     - `sellPrice`
     - `resourceId?`
     - компактные `tags`/`reason`.
   - Сохрани обратную совместимость `getAdjustedItemPrice()` для существующего UI.
   - Price cache должен оставаться bounded и инвалидироваться через `priceVersion`.

3. Добавь `src/systems/trade.ts`:
   - `buyFromNpc(state, player, npc, slotIndex, opts)` или похожий API.
   - `sellToNpc(state, player, npc, slotIndex, opts)`.
   - Функции должны:
     - проверять деньги и место в инвентаре;
     - перемещать ровно одну единицу stack;
     - использовать quote API;
     - менять `Entity.money`;
     - публиковать существующие trade events;
     - менять resource stock: покупка игроком уменьшает supply этажа, продажа увеличивает supply этажа.
   - Сохрани особые handoff paths: `tryHandleMaronaryShavingHandoff`, `recordPlayerItemSale`, shelter tally logic. Если это неудобно вынести полностью, оставь маленькие callbacks из `main.ts`, но не копируй весь buy/sell блок.

4. Добавь buy/sell spread:
   - Игрок покупает дороже, продает дешевле.
   - Не ломай старую экономику: default spread должен быть мягким, примерно 15-30%.
   - У торговцев с `Occupation.STOREKEEPER`, `WILD`, `CULTIST`, `LIQUIDATOR`, `SCIENTIST` могут быть разные spread/tags, но без огромной таблицы.

5. Тарифы пока должны быть простыми:
   - data rules в `economy_rules.ts`, не новая симуляция.
   - API должен позволять будущей caravan task добавить временный modifier через state/event/tag.

## Acceptance

- На одном и том же stock вода на `KVARTIRY` дороже, чем на `LIVING`.
- Металл/tools на `MAINTENANCE` не дороже базового бытового этажа при нормальном stock.
- Покупка воды у NPC уменьшает `drink_water` stock текущего этажа.
- Продажа воды NPC увеличивает `drink_water` stock текущего этажа.
- При нехватке денег/места инвентарь и деньги не меняются.
- Trade events сохраняют item, price, direction и tags.
- Старые callers `getAdjustedItemPrice()` продолжают компилироваться.

## Проверки

Минимум:

```bash
npm run typecheck
npm run test:unit -- tests/economy-trade.test.ts
```

Если тронул `main.ts`, дополнительно:

```bash
npm run check
```

