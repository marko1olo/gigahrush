# Cloudflare Net Sphere

НЕТ-СФЕРА добавляет к статичному Vite-билду маленький Cloudflare Worker слой:

- `functions/worker.ts` - Worker entrypoint: `/api/net/*` уходит в API, остальное в Worker Assets.
- `functions/api/net/hello.ts` - heartbeat, онлайн, личный облачный профиль.
- `functions/api/net/stats.ts` - публичная статистика для меню.
- `functions/api/net/event.ts` - игровые события: `samosbor`, `death`.
- `functions/api/net/chat.ts` - короткий общий текстовый терминал.
- `cloudflare/d1/net_sphere.sql` - D1-схема.
- `cloudflare/d1/net_sphere_names.sql` - миграция для ника и человекочитаемой сводки событий.

Клиент остается без runtime-зависимостей: только `fetch` к same-origin `/api/net/*`.

## Setup

1. В Cloudflare Workers проекте оставь:

```txt
Build command: npm run build
```

Статика обслуживается через `assets.directory` в `wrangler.jsonc`, а API через `functions/worker.ts`.

2. Один раз залогинь Wrangler на этой машине:

```bash
npx wrangler login
```

3. Запусти setup из репозитория:

```bash
npm run cf:setup
```

Скрипт сам создаст или найдет D1 `gigahrush-net`, пропишет binding `GIGA_NET` в `wrangler.jsonc` с реальным `database_id`, применит `cloudflare/d1/net_sphere.sql` и добавит недостающие колонки/индекс для старых баз через защищенные миграции.

4. Если Cloudflare Workers уже привязан к GitHub, просто redeploy Worker. `wrangler.jsonc` теперь источник правды: `name`, `main`, `assets`, `compatibility_date`, D1 binding.

Если не хочешь использовать `wrangler.jsonc` как источник правды, тот же binding можно добавить вручную в dashboard:

```txt
Workers & Pages -> gigahrush -> Settings -> Bindings -> Add -> D1 database
Variable name: GIGA_NET
Database: gigahrush-net
```

После деплоя `/api/net/stats` должен вернуть JSON.

Cloudflare docs:

- Workers static assets: https://developers.cloudflare.com/workers/static-assets/
- Workers D1 bindings: https://developers.cloudflare.com/d1/worker-api/

## Local Cloudflare Test

Обычный `npm run dev` не поднимает Worker API. Для проверки API локально:

```bash
npm run build
npm run cf:dev
```

`cf:dev` использует `wrangler.jsonc`. Перед ним нужен `npm run cf:setup`, чтобы в конфиге был реальный D1 `database_id`. Это не секрет: Cloudflare Worker нужен конкретный UUID базы для binding, а `cf:setup` перезаписывает его под текущий аккаунт.

Чтобы только повторно применить схему и защищенные миграции к уже настроенной базе:

```bash
npm run cf:schema
```

## In Game

- `N` открывает НЕТ-СФЕРУ.
- Новый браузер получает личный НЕТ-ГЕН вида `NET-XXXX-XXXX-XXXX` и хранит его в `localStorage`.
- Перед входом игрок вводит НЕТ-ИМЯ; оно хранится в `localStorage` и уходит в облачный профиль.
- В терминале можно ввести `/netgen NET-...`, чтобы вернуться к старому сетевому профилю.
- `/new` выдает новый НЕТ-ГЕН.
- `/clear` очищает локально загруженные строки терминала.

Сейчас облачный прогресс - это профиль и агрегаты: запуски, самосборы, смерти, лучший уровень, лучший счетчик самосборов, последний этаж. Полное сохранение игры в облако намеренно не отправляется, чтобы не связывать D1 с форматом локального save.

## Stored Data

`net_players`

- `net_gen` - личный код облачного профиля; в игре игрок видит только свой код.
- `nickname` - последнее НЕТ-ИМЯ игрока.
- `runs` - новые browser-session входы.
- `total_samosbors`, `deaths` - личные счетчики.
- `best_level`, `best_samosbor_count`, `last_floor` - компактный прогресс.
- `progress_json` - последний краткий snapshot, пригоден для будущих онлайн-фич.

`net_sessions`

- `session_id`, `net_gen`, `last_seen_at`.
- Онлайн считается по сессиям с `last_seen_at` за последние 90 секунд.

`net_events`

- Уникальные события с `event_key`.
- `net_gen` хранится как внутренний владелец события и не отдается в публичную сводку.
- Сейчас используются типы `samosbor` и `death`.
- `summary` хранит короткую строку для НЕТ-СФЕРЫ, например `[nickname] умер 2026-05-18 02:42 UTC`.

`net_chat`

- `net_gen`, `body`, `created_at`; `net_gen` нужен для лимита и привязки к профилю, публичная строка чата отдается с `nickname`.
- Сообщения режутся до 160 символов.

## Safety

- НЕТ-ГЕН, session id, event key и сообщения валидируются на сервере.
- НЕТ-ИМЯ валидируется на клиенте и сервере, режется до 24 символов.
- Сообщения чистятся от control chars и символов `<`, `>`, `` ` ``, `\`.
- Публичные строки терминала и сводки не отдают чужой НЕТ-ГЕН, только ник и текст/summary.
- В игре терминал рисуется через canvas `fillText`, не через HTML.
- Есть простое ограничение: одно сообщение от одного НЕТ-ГЕН раз в 2.5 секунды.

## Expansion Points

Новые онлайн-фичи добавляются без изменения клиента API-формата:

- новый event type в `/api/net/event`;
- новая колонка или JSON-поле в `progress_json`;
- новый endpoint под `functions/api/net/<feature>.ts`;
- новый блок в canvas overlay `src/render/net_sphere_ui.ts`.

Для realtime-чата или присутствия без polling следующим шагом будет Durable Object + WebSocket, но текущая D1/polling схема проще и дешевле для первого публичного билда.
