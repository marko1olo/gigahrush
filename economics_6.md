# economics_6.md — локальная биржа, портфель и event-driven курс

## Роль

Ты GPT-5.5 worker. Это runtime-system задача. Ты не один в кодовой базе: используй catalog корпораций из `economics_5.md` и banking API из `economics_2.md`; не создавай несовместимые дубликаты.

## Цель

Сделать биржу для single-player/offline режима: игрок покупает/продает акции за рубли со счета, курс меняется случайно и от игровых событий. Это должно работать без Cloudflare. Cloudflare-глобализация — отдельная задача.

## Dependencies

Ожидаемые API:

- `src/data/corporations.ts` из `economics_5.md`
- `src/systems/banking.ts` из `economics_2.md`

Если их еще нет, работай против тонких adapter signatures и отметь merge note. Не добавляй второй каталог корпораций в другом файле.

## Ownership

Основные файлы:

- новый `src/systems/stock_market.ts`
- новый `src/data/stock_market.ts` при необходимости для constants
- `tests/stock-market.test.ts`

Интеграционные файлы:

- `src/main.ts` только для save/load/tick/initialization.
- `src/systems/events.ts` только если нужно зарегистрировать observer/import; предпочтительно сделать явный `updateStockMarket(state)` tick, который читает recent events по `lastEventId`.

Не трогай:

- `functions/api/net/*`
- `cloudflare/d1/*`
- `src/render/net_sphere_ui.ts` кроме minimal snapshot type, если UI task еще не готова.
- `src/core/types.ts`

## Требования

1. State:
   - Host type: `GameState & { stockMarket?: StockMarketState }`.
   - `StockMarketState`:
     - `quotes: Record<corpId, { price, lastDelta, drift, volume, lastTickAt }>`
     - `portfolio: Record<corpId, { shares, avgPrice }>`
     - `lastEventId`
     - `lastRandomTickAt`
     - bounded `recentTrades`.
   - Normalize старые saves.

2. API:
   - `ensureStockMarketState(state)`
   - `normalizeStockMarketState(value)`
   - `stockMarketForSave(state)`
   - `tickStockMarket(state)`
   - `buyShares(state, corpId, shares)`
   - `sellShares(state, corpId, shares)`
   - `portfolioValue(state)`
   - `stockMarketSnapshot(state)`

3. Trading:
   - Покупка/продажа идет со счета banking, не из наличных.
   - Нельзя купить больше, чем позволяет счет.
   - Нельзя продать больше shares, чем есть.
   - Можно покупать fractional shares? Для простоты нет: integer shares.
   - Добавь небольшую комиссию/спред, чтобы торговля не была бесплатной арбитражной петлей.

4. Price movement:
   - Random drift на медленном tick, не каждый frame.
   - Event-driven impulses:
     - `player_kill_monster` / `npc_kill_monster` с industrial monster tags двигают heavy industry.
     - `room_produced_items` повышает связанные factory корпорации.
     - `room_lacked_resources` / `room_blocked_production` снижает связанные заводы.
     - slime/science/sample events двигают НИИ.
     - caravan/tariff events двигают logistics.
     - faction/contract completion может влиять через tags.
   - Используй `getRecentEvents(state, { sinceId: lastEventId })`, cap обработку за tick.
   - Clamp цены, например `1..99999`.

5. Events:
   - Покупка/продажа акций публикует event с tags `stock_market`, `buy_shares`/`sell_shares`, `corp_<id>`.
   - Если `WorldEventType` не расширяешь, используй ближайший existing type только с аккуратными tags/data. Лучше добавить dedicated types только при необходимости и с тестами.

## Acceptance

- Новый state нормализуется из пустого save.
- Покупка акций уменьшает банковский счет и увеличивает portfolio.
- Продажа акций увеличивает банковский счет и уменьшает portfolio.
- Random tick меняет хотя бы часть котировок, но bounded.
- Production event меняет связанную котировку предсказуемо в unit test.
- Monster kill/slime event меняет нужную корпорацию через tags/signals.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/stock-market.test.ts
npm run check
```

