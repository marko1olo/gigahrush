# economics_7.md — Cloudflare НЕТ-биржа и глобальные импульсы игроков

## Роль

Ты GPT-5.5 worker. Это optional-cloud task. Ты не один в кодовой базе: single-file/local build обязан работать без D1/API. Не делай Cloudflare обязательным для прогресса.

## Цель

Для Cloudflare версии сделать биржу зависящей от действий всех игроков: клиент отправляет компактные market impulses, сервер хранит агрегаты в D1 и возвращает market snapshot. Offline/local режим продолжает использовать локальную биржу из `economics_6.md`.

## Текущий факт

- Net Sphere client: `src/systems/net_sphere.ts`.
- UI: `src/render/net_sphere_ui.ts`.
- API: `functions/api/net/hello.ts`, `stats.ts`, `chat.ts`, `event.ts`, `common.ts`.
- D1 schema: `cloudflare/d1/net_sphere.sql`, migration example `net_sphere_names.sql`.
- Tests: `tests/net-sphere.test.ts` mocks D1.
- If D1 binding missing, API returns 503 and game continues local/offline.

## Dependencies

Ожидаемые API:

- `src/data/corporations.ts` из `economics_5.md`
- `src/systems/stock_market.ts` из `economics_6.md`

Если их нет, добавь server-side endpoints/schema и client adapter с typed payload shape, но не реализуй второй stock market.

## Ownership

Основные файлы:

- новый `functions/api/net/market.ts`
- `functions/api/net/common.ts`
- новая migration `cloudflare/d1/net_sphere_market.sql` или аккуратное расширение setup path
- `scripts/cloudflare-net-setup.mjs`
- `tests/net-market.test.ts` или расширение `tests/net-sphere.test.ts`
- `cloudflare.md`

Client integration:

- `src/systems/net_sphere.ts` только для optional market send/poll adapter.
- `src/systems/stock_market.ts` только для применения remote snapshot, если task 6 уже есть.

Не трогай:

- `src/core/types.ts`
- gameplay generators
- bank floor
- trade core.

## Требования

1. D1 schema:
   - Таблица для market impulses:
     - `id`
     - `net_gen`
     - `corp_id`
     - `kind`
     - `magnitude`
     - `created_at`
     - `event_key`
   - Таблица или view для aggregate snapshots:
     - `corp_id`
     - `price`
     - `last_delta`
     - `volume`
     - `updated_at`
   - Индексы по `created_at`, `corp_id`, `event_key`.
   - Idempotency через `event_key`.

2. API:
   - `GET /api/net/market` возвращает snapshot.
   - `POST /api/net/market` принимает:
     - `netGen`
     - `sessionId`
     - `progress`
     - compact impulses `[ { eventKey, corpId, kind, magnitude } ]`
   - Sanitize everything:
     - corp id lowercase safe string;
     - magnitude bounded;
     - payload small.
   - Возвращай `{ ok: true, market }`.

3. Client:
   - `net_sphere.ts` должен иметь optional market sync functions.
   - Network failure only sets offline/error state; gameplay continues.
   - Не отправляй raw event logs; только bounded market impulses.
   - Heartbeat/poll может piggyback market snapshot, но не раздувай existing hello payload без необходимости.

4. Stock merge:
   - Remote snapshot должен мягко влиять на local quotes, не мгновенно перетирать портфель/цены.
   - Portfolio остается local save, не server-authoritative.
   - Для обычной версии local random/player events остаются единственным источником.

5. Tests:
   - D1 mock должен покрыть:
     - bad identity -> 400;
     - missing D1 -> 503;
     - insert impulses idempotent;
     - GET snapshot returns bounded rows;
     - payload too large rejected.

## Acceptance

- Cloudflare setup/schema включает market tables.
- `GET /api/net/market` работает в mocked D1 test.
- `POST /api/net/market` применяет impulses и не дублирует один `eventKey`.
- Client compiles and ignores offline API.
- Local build без Cloudflare не ломается.

## Проверки

```bash
npm run typecheck
npm run test:unit -- tests/net-market.test.ts
npm run cf:schema
npm run check
```

Если `cf:schema` недоступен из-за окружения, явно укажи причину в отчете.

