# economics_5.md — корпорации и каталог акций

## Роль

Ты GPT-5.5 worker. Это data-first задача, специально выделенная для параллельной работы без конфликтов. Не добавляй runtime биржу здесь.

## Цель

Добавить расширяемый каталог корпораций и акций, на который смогут ссылаться биржа, производство, квесты, фракционные события и Cloudflare market. Нужны TOHA Heavy Industries в духе BLAME!-референса и советско-гигакхрущевские заводы/комбинаты.

## Текущий факт

- Сейчас нет `CorporationDef`.
- Есть ресурсы в `src/data/resources.ts`.
- Есть factories в `src/data/factories.ts`.
- Есть event tags в `systems/events.ts` и production/faction events.
- Архитектура предпочитает string ids и регистры, не enums.

## Ownership

Основные файлы:

- новый `src/data/corporations.ts`
- `tests/corporations.test.ts`

Разрешено:

- `src/data/catalog.ts` только если проектный стиль требует re-export. Если можно импортировать напрямую, не трогай catalog.

Не трогай:

- `src/systems/stock_market.ts`
- `src/systems/economy.ts`
- `src/data/factories.ts`
- `src/data/resources.ts`
- `src/core/types.ts`

## Требования

1. Добавь типы:
   - `CorporationId` как string type alias или plain string.
   - `CorporationDef`:
     - `id`
     - `name`
     - `ticker`
     - `desc`
     - `sector`
     - `basePrice`
     - `volatility`
     - `resourceIds`
     - `factoryIds`
     - `positiveEventTags`
     - `negativeEventTags`
     - `factionBias?`
     - `rumorTags`
   - `StockSignalDef` или поле signal mapping, но без runtime применения.

2. Добавь минимум 10 корпораций:
   - `toha_heavy_industries` — `ТОХА Heavy Industries`, тяжелая промышленность, арматура, роботы, металл.
   - `gigakhrush_panel_trust` — `Трест ГИГАХРУЩ-Панель`, бетон, панели, стены.
   - `zavod_serp_i_beton` — `Завод «Серп и Бетон»`.
   - `oktyabrskaya_truba` — `Октябрьская Труба`.
   - `nii_slizi_i_biologii` — `НИИ Слизи и Прикладной Биологии`.
   - `podzemvodstroy` — `Подземводстрой`.
   - `metallopetlya_kombinat` — `Комбинат «Металлопетля»`.
   - `zhelemish_pischeprom` — `Желемыш-Пищепром`.
   - `net_obmen_kontora` — `НЕТ-Обмен Контора`.
   - `krasnyy_koridor_logistics` — `Красный Коридор Логистика`.
   - Можно добавить больше, если помогает балансу.

3. Signal taste:
   - Убийства robot/rebar/industrial monsters могут влиять на heavy industry.
   - Slime/sample/science события влияют на биолаб.
   - Production output/shortage влияет на заводы.
   - Caravan/tariff events влияют на logistics.
   - Net events/online exchange влияет на `net_obmen_kontora`.

4. Validate:
   - tickers uppercase ASCII, 2-5 chars.
   - ids lowercase snake case.
   - `resourceIds` существуют в `RESOURCES`.
   - `factoryIds` существуют в `FACTORIES`.
   - base prices positive and bounded.

## Acceptance

- `CORPORATIONS` export содержит минимум 10 defs.
- `CORPORATION_BY_ID` и `CORPORATION_BY_TICKER` готовы.
- `validateCorporations()` возвращает список проблем и используется в tests.
- Нет runtime dependency и нет world mutation.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/corporations.test.ts
```

