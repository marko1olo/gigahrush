# economics_2.md — рублевый счет, депозиты и кредиты

## Роль

Ты GPT-5.5 worker. Ты не один в кодовой базе: не откатывай чужие изменения, не переписывай торговлю, биржу или НЕТ-терминалы, если они не входят в этот task.

## Цель

Добавить постоянный рублевый счет игрока поверх наличных `player.money`, чтобы у игрока было, что копить. Деньги на счете нужны будущей бирже; депозиты и кредиты нужны банковскому этажу и НЕТ-терминалам.

## Текущий факт

- Наличные сейчас лежат в `Entity.money?: number`.
- Save/load сохраняет `player.money`, `state.economy`, `state.production`, containers.
- `GameState` не имеет банковского shape в core, и core лучше не трогать.
- Старые save shapes нормализуются через системы (`normalizeGameEconomy()` как пример).

## Ownership

Основные файлы:

- новый `src/data/banking.ts`
- новый `src/systems/banking.ts`
- `tests/banking.test.ts`

Интеграционные файлы:

- `src/main.ts` только для save/load/new-game/tick вызовов банковского состояния.
- `tests/helpers.ts`, если нужен helper state для тестов.

Не трогай:

- `src/render/net_sphere_ui.ts`
- `src/render/net_terminal_gen_ui.ts`
- `src/systems/stock_market.ts`
- `src/data/corporations.ts`
- `src/core/types.ts`

## Требования

1. Введи state без изменения `GameState` interface:
   - используй intersection host type: `GameState & { banking?: BankingState }`.
   - `BankingState` должен содержать:
     - `accountRubles`
     - `depositPrincipal`
     - `depositOpenedAt`
     - `depositRate`
     - `loanPrincipal`
     - `loanAccrued`
     - `loanRate`
     - `loanTakenAt`
     - `creditLimit`
     - `lastInterestAt`
     - `ledgerVersion`
     - bounded `recentLedger` entries.

2. Runtime API:
   - `ensureBankingState(state)`
   - `normalizeBankingState(value)`
   - `bankingForSave(state)`
   - `cashToAccount(state, player, amount, source?)`
   - `accountToCash(state, player, amount, source?)`
   - `openDeposit(state, amount)`
   - `closeDeposit(state)`
   - `takeLoan(state, amount, source?)`
   - `repayLoan(state, amount, source?)`
   - `tickBankingInterest(state)`
   - `bankingSummary(state)`

3. Правила денег:
   - Депозит и покупка акций должны работать со счетом, не с наличными.
   - `cashToAccount` снимает с `player.money`.
   - `accountToCash` кладет в `player.money`.
   - Нельзя уйти в отрицательный счет без кредита.
   - Кредит увеличивает `accountRubles`, долг живет отдельно.
   - Repay сначала гасит accrued interest, потом principal.
   - Interest tick должен быть медленным и bounded, без per-frame сложного начисления.

4. Events:
   - Публикуй события через `publishEvent()` для крупных операций.
   - Если не хочешь расширять `WorldEventType`, используй существующие подходящие типы с tags/data, но лучше добавить новые типы отдельной интеграционной правкой только если действительно нужно.
   - Tags: `banking`, `deposit`, `withdraw`, `loan`, `repay`, `account`.

5. Save/load:
   - Добавь save/load в `main.ts`.
   - Старые saves без banking должны грузиться с нулевым счетом и без долгов.

## Acceptance

- Можно положить наличные на счет, снять со счета обратно в наличные.
- Нельзя положить больше наличных, чем есть у игрока.
- Нельзя снять больше счета.
- Кредит увеличивает счет и создает долг.
- Погашение уменьшает долг и счет.
- Депозит начисляет проценты при `tickBankingInterest()` после заданного игрового времени.
- Старый save без banking нормализуется.
- `bankingForSave()` возвращает компактное plain-object состояние.

## Проверки

Минимум:

```bash
npm run typecheck
npm run test:unit -- tests/banking.test.ts
```

Если тронул save/load в `main.ts`:

```bash
npm run check
```

