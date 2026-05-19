# economics_10.md — интеграция, баланс, тесты и фактическая документация

## Роль

Ты GPT-5.5 worker/integrator. Эта задача последняя в пачке economics. Ты не один в кодовой базе: твоя работа — свести результаты других economics agents, не переписать их заново.

## Цель

Собрать экономическое расширение в работоспособный shipped slice: цены, счет, банк, терминалы, биржа, корпорации, караваны и UI должны компилироваться вместе, иметь тесты и быть документированы как фактическое поведение.

## Inputs

Перед началом прочитай результаты:

- `economics_1.md` trade/economy kernel
- `economics_2.md` banking
- `economics_3.md` net terminals/account access
- `economics_4.md` bank floor
- `economics_5.md` corporations
- `economics_6.md` local stock market
- `economics_7.md` Cloudflare market
- `economics_8.md` caravans/tariffs
- `economics_9.md` money UI

Если часть задач не смержена, интегрируй только присутствующее и явно отметь missing modules.

## Ownership

Основные файлы:

- `README.md`
- `architecture.md` только если появились новые generic system contracts.
- `cloudflare.md` только если Cloudflare market реально работает.
- `tests/content-registry.test.ts`
- `tests/data-ids.test.ts`
- `tests/events-economy.test.ts`
- любые новые economics tests, которые требуют coordinated fix.

Осторожные balance edits:

- `src/data/items.ts`
- `src/data/resources.ts`
- `src/data/contracts.ts`
- `src/data/factories.ts`
- `src/data/economy_rules.ts`
- `src/data/corporations.ts`

Не трогай:

- `src/core/types.ts`, если нет реальной compile необходимости.
- `src/render/webgl.ts`.
- unrelated monsters/floors.

## Требования

1. Integration audit:
   - Нет двух разных banking states.
   - Нет двух разных corporation catalogs.
   - Stock market использует banking account, а не наличные, кроме explicit fallback.
   - Net terminal bank access не ломает GEN map editor access.
   - Cloudflare API optional: local build работает без D1.
   - Все new state shapes нормализуются из old saves.

2. Balance pass:
   - Starting cash `player.money` не должен обесценивать депозит/кредит.
   - Базовые item values не должны делать акции бесплатными или невозможными.
   - Buy/sell spread не должен ломать раннюю торговлю водой/едой.
   - Депозитная ставка должна быть приятной, но не доминировать survival loop.
   - Кредит должен быть полезным, но иметь заметный долг/риск.
   - Stock volatility должна давать желание копить/рисковать, но не быть казино каждую секунду.

3. Tests:
   - Добавь/почини validations:
     - corporation ids/tickers/resources/factories.
     - economy rules reference existing resources/floors.
     - banking normalize old save.
     - stock normalize old save.
     - caravan defs reference resources.
     - net market API optional behavior.
   - Не замазывай failing test. Разбери ошибку и исправь.

4. README:
   - Обновляй только shipped facts.
   - Добавь кратко:
     - деньги: наличные + счет;
     - банковский этаж;
     - НЕТ-терминалы минимум 16/этаж и банковский доступ без GEN;
     - биржа/корпорации;
     - Cloudflare global market только если endpoint работает;
     - караваны/тарифы.
   - Обнови implementation snapshot counts, если изменились.

5. Debug/QA:
   - Убедись, что debug summary есть для:
     - economy prices;
     - banking;
     - stock market;
     - caravans.
   - Если какого-то debug нет, добавь короткий summary command без большого UI.

## Acceptance

- `npm run check` проходит.
- Если UI/render/net-terminal менялись, `npm run smoke` проходит или skipped с конкретной причиной.
- README не обещает того, что не реализовано.
- No unused locals/params.
- Нет per-frame full-world scans.
- Нет обязательной Cloudflare зависимости для single-file/local build.

## Проверки

```bash
npm run typecheck
npm run test:unit
npm run content:audit
npm run build
npm run check
```

Для полной проверки, если окружение позволяет:

```bash
npm run smoke
```

