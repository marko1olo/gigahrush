# economics_8.md — караваны, тарифы и supply lanes

## Роль

Ты GPT-5.5 worker. Это content+system задача с bounded slow ticks. Ты не один в кодовой базе: не переписывай faction events или economy core целиком.

## Цель

Добавить экономические караваны и тарифы: этажи должны ощущаться как разные рынки с поставками, пошлинами, рисками и маршрутами. Игрок должен видеть решения: заплатить тариф, провести караван, ограбить, сдать маршрут, открыть/закрыть supply lane.

## Текущий факт

- Уже есть `FactionEventDef` с `relief_caravan`, drops/containerDrops/economyDeltas.
- `systems/faction_events.ts` уже применяет `economyDeltas` через `changeResourceStock()`.
- Есть item `caravan_route`.
- Есть route/content hooks вроде `kv08_route_assembly`.
- Economy task 1 должна добавить tariff multiplier hooks.

## Ownership

Основные файлы:

- новый `src/data/caravans.ts`
- новый `src/systems/caravans.ts`
- `tests/caravans.test.ts`

Разрешенные content files:

- новый `src/gen/living/caravan_exchange.ts` или floor-appropriate self-contained module.
- local content manifest import для выбранного floor.

Осторожные shared edits:

- `src/data/faction_events.ts` только добавить новые caravan/tariff definitions.
- `src/systems/faction_events.ts` только если существующего `economyDeltas` недостаточно.
- `src/systems/economy.ts` только через public tariff hook из economics_1; не переписывай pricing.

Не трогай:

- `src/main.ts`, если можно зарегистрировать system через existing update path. Если main нужен для tick, сделай минимальную интеграционную правку и отметь conflict risk.
- `src/core/types.ts`
- stock/banking/net Cloudflare.

## Требования

1. Data definitions:
   - `CaravanLaneDef`:
     - `id`
     - `name`
     - `fromFloor`
     - `toFloor`
     - `resourceDeltas`
     - `tariffResourceIds`
     - `feeRubles`
     - `riskTags`
     - `corpIds?`
     - `faction`
   - Минимум 6 lanes:
     - Kvartiry -> Living food/water queue.
     - Maintenance -> Living metal/tools.
     - Production Belt -> Black Market 88 contraband/ammo.
     - Ministry -> Bank/Market documents.
     - Hell -> Cult/psi goods.
     - Net/terminal route for exchange data.

2. Runtime:
   - Slow tick, not per-frame scan.
   - Process at most a small number of lane updates per tick.
   - Apply `changeResourceStock()` to source/destination floors.
   - Publish events with tags: `caravan`, `tariff`, `supply_lane`, lane id, resource ids.
   - Expose `summarizeCaravans(state)`.

3. Player-visible content:
   - Add one reachable caravan exchange/office/queue.
   - Player can:
     - pay tariff to stabilize a lane;
     - steal/rob cargo for immediate items but worsen stock/tariff;
     - hand in `caravan_route` to open a lane.
   - Use existing containers/quests/events rather than new DOM UI.

4. Tariffs:
   - Tariff should affect price quotes through economics_1 API.
   - If economics_1 is absent, store tariff state and expose a getter with clear TODO integration.

5. Corporate hooks:
   - If corporations exist, caravan events include `corpId` in data/tags for stock_market.
   - Do not import stock system directly.

## Acceptance

- At least 6 data lanes exist and validate.
- Force/tick caravan changes resources on at least two floors in tests.
- Tariff state can make one resource more expensive via economy quote or exposed hook.
- Reachable content gives player at least two choices.
- Events are visible in recent event buffer and world log/rumor path if applicable.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/caravans.test.ts
npm run check
```

