# economics_9.md — UI видимости денег, счета, долгов и портфеля

## Роль

Ты GPT-5.5 worker. Это render/UI задача. Ты не один в кодовой базе: UI должен читать публичные snapshots из banking/trade/stock systems и не владеть gameplay decisions.

## Цель

Главная UX-задача экономики: игрок всегда должен понимать, что у него есть деньги, счет, долги, депозит и потенциальный портфель. Это должно вызывать желание копить, а не прятаться в debug/menu.

## Dependencies

Ожидаемые API:

- quote API из `economics_1.md`
- banking summary из `economics_2.md`
- stock snapshot/portfolio value из `economics_6.md`

Если часть API отсутствует, добавь graceful optional display: наличные показываются всегда, отсутствующие системы скрываются без ошибок.

## Ownership

Основные файлы:

- `src/render/hud.ts`
- `src/render/stats_ui.ts`
- `src/render/npc_ui.ts`
- новый `src/render/economy_ui.ts`, если общий formatter/drawer нужен 3+ местам.
- `tests/ui-layout.test.ts` или новый `tests/economy-ui.test.ts`.

Разрешено:

- `src/systems/debug.ts` добавить finance summary command, если нужно для QA.
- `src/render/net_sphere_ui.ts` только если stock market уже имеет snapshot и нужна биржевая вкладка.

Не трогай:

- `src/systems/banking.ts` кроме public snapshot imports.
- `src/systems/stock_market.ts` кроме public snapshot imports.
- `src/main.ts`, если можно обойтись render reads.
- `src/core/types.ts`

## Требования

1. HUD:
   - Покажи компактно:
     - наличные `₽`
     - счет `сч`
     - долг warning, если есть.
   - Не перегружай экран; это canvas HUD, не DOM dashboard.
   - На mobile не клиппить и не перекрывать важные prompts.

2. Stats/inventory finance section:
   - Добавь finance block:
     - наличные;
     - счет;
     - депозит + текущая оценка процентов;
     - кредит/долг;
     - стоимость портфеля;
     - P/L по акциям.
   - Если stock/banking нет, показывай только наличные и не падай.

3. Trade UI:
   - Вместо одной строки `Цена: X₽` показывай компактную причину:
     - `Цена: 24₽ спрос x1.3 дефицит x2.0`
     - или `Скупка: 18₽ / продажа: 24₽`, в зависимости от side.
   - Используй quote API; если его нет, fallback на `getAdjustedItemPrice`.
   - Покажи, хватает ли денег/места, цветом.

4. Net/stock UI:
   - Если уже есть stock snapshot, НЕТ-СФЕРА может показывать 4-6 котировок, счет и портфель.
   - Не превращай Net Sphere chat в сложный DOM-like интерфейс. Canvas, компактные строки, tab/panel только если уже вписывается.

5. Text/scaling:
   - Русский player-facing текст нормален.
   - Не используй длинные объяснения прямо в UI.
   - Все строки через `fitText`/wrapping.
   - Проверить 1024x768 и mobile-ish viewport.

## Acceptance

- Наличные видны вне trade menu.
- Счет/долг/депозит видны, если banking state есть.
- В trade menu игрок видит не только цену, но и короткую причину цены.
- Portfolio value видна, если stock market есть.
- UI не падает на saves без banking/stock.
- Tests или smoke покрывают отсутствие clipping/undefined crash для missing optional state.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/ui-layout.test.ts
npm run check
```

Обязательно визуально проверить canvas после запуска или smoke:

```bash
npm run smoke
```

