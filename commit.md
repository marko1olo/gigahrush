# Commit Runbook For Agents

Эта инструкция применяется, когда пользователь дает короткую команду вроде `комить`, `сделай коммит`, `commit`, `закоммить и выложи`.

Цель каждого коммита для ГИГАХРУЩ:

1. Собрать новый HTML5 ZIP для itch.io.
2. Закоммитить проект и отправить коммит в GitHub.
3. Убедиться, что Cloudflare Worker под аккаунтом `jirnyak` отдает свежую сборку на `https://gigahrush.bileter.workers.dev`.

Не останавливайся после локального коммита. Команда `комить` означает весь релизный цикл ниже.

## Быстрый Маршрут

```bash
git status --short
npm run check
npm run itch:build
unzip -l itch/gigahrush-itch.zip | sed -n '1,40p'
npx wrangler whoami
git add -A
git status --short
git commit -m "<краткое описание>"
git push origin HEAD
git rev-parse HEAD
git ls-remote origin HEAD
npm run cf:deploy
curl -fsSI "https://gigahrush.bileter.workers.dev/?v=$(git rev-parse --short HEAD)"
curl -fsS "https://gigahrush.bileter.workers.dev/api/net/stats" | head -c 500
```

Если любой обязательный шаг падает, остановись, прочитай реальную ошибку, исправь ее или явно сообщи блокер. Не объявляй релиз готовым по предположению.

## 1. Перед Коммитом

Сначала прочитай текущее состояние:

```bash
git status --short
git diff --stat
```

Проверь, что в коммит не попадают секреты, временные файлы, `.env`, `.wrangler/`, `node_modules/`, локальные логи, случайные дампы и приватные токены.

Если рабочее дерево содержит много чужих изменений, не откатывай их. Команда `комить` обычно означает закоммитить текущую согласованную работу. Если есть явно случайные файлы или конфликтующие изменения, остановись и спроси пользователя одним коротким вопросом.

## 2. Обязательная Проверка Проекта

Для обычного релизного коммита запускай:

```bash
npm run check
```

Это покрывает:

- `npm run typecheck`;
- `npm run test:unit`;
- `npm run content:audit`;
- `npm run build`.

Если изменения затрагивали UI, рендер, мобильное поведение, сохранения, Cloudflare API или критичный игровой цикл, дополнительно запускай:

```bash
npm run smoke
```

Если smoke невозможен из-за окружения, так и напиши в итоговом отчете.

## 3. Новый ZIP Для itch.io

Собери itch.io пакет:

```bash
npm run itch:build
```

Ожидаемый результат:

- `itch/index.html`;
- `itch/gigahrush-itch.zip`;
- `itch/ITCH_UPLOAD_NOTES.txt`.

Проверь форму архива:

```bash
unzip -l itch/gigahrush-itch.zip | sed -n '1,80p'
```

Критично: `index.html` должен лежать в корне ZIP. Если внутри архива путь выглядит как `dist/index.html` или `itch/index.html`, пакет неправильный для itch.io.

`itch/` находится в `.gitignore`, поэтому ZIP обычно не коммитится. Это релизный артефакт для загрузки на itch.io, а не исходный код. Если пользователь отдельно просит загрузить файл на itch.io, используй `itch/gigahrush-itch.zip` и настройки из `itch/ITCH_UPLOAD_NOTES.txt` и `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`.

## 4. Wrangler И Cloudflare Аккаунт

Перед деплоем проверь, что Wrangler залогинен в правильный Cloudflare аккаунт:

```bash
npx wrangler whoami
```

В выводе должен быть аккаунт/пользователь `jirnyak` или аккаунт, который пользователь явно считает рабочим для `gigahrush.bileter.workers.dev`.

Если Wrangler не залогинен или показывает другой аккаунт, не деплой. Сообщи пользователю:

```txt
Wrangler не в аккаунте jirnyak; нужен npx wrangler login под правильным Cloudflare аккаунтом.
```

Не меняй `wrangler.jsonc` ради обхода аккаунта. Текущий Worker:

- name: `gigahrush`;
- assets: `./dist`;
- Worker entrypoint: `./functions/worker.ts`;
- D1 binding: `GIGA_NET`;
- live URL: `https://gigahrush.bileter.workers.dev`.

## 5. GitHub Commit And Push

Посмотри, что будет закоммичено:

```bash
git status --short
git diff --stat --cached
```

Если staged пустой, добавь релевантные изменения:

```bash
git add -A
git status --short
```

Сформулируй короткий commit message по фактическому diff. Примеры:

```bash
git commit -m "Add release commit runbook"
git commit -m "Expand living floor content"
git commit -m "Fix Net Sphere deployment API"
```

Затем отправь в GitHub:

```bash
git push origin HEAD
```

Проверь, что локальный HEAD совпадает с GitHub:

```bash
git rev-parse HEAD
git ls-remote origin HEAD
```

Хэши должны совпадать. Это обязательная защита: Cloudflare-деплой должен соответствовать коммиту, который уже лежит на GitHub, а не незапушенному локальному состоянию.

Если push отклонен, сначала сделай безопасный sync без потери чужих изменений:

```bash
git pull --rebase --autostash origin "$(git branch --show-current)"
```

После rebase снова запусти как минимум `npm run check`, затем повтори commit/push при необходимости.

## 6. Cloudflare Deploy

После успешного push разверни свежую сборку через Wrangler:

```bash
npm run cf:deploy
```

`cf:deploy` сам запускает `npm run build` и затем `wrangler deploy`, используя `wrangler.jsonc`.

Если проект также подключен к GitHub auto-deploy в Cloudflare, все равно проверяй живой сайт. GitHub push сам по себе не доказывает, что Worker уже обновился.

После деплоя проверь, что повторная сборка не оставила новых tracked-изменений:

```bash
git status --short
```

Если `npm run cf:deploy` изменил tracked-файл, например `dist/index.html`, значит коммит не совпадает с развернутым состоянием. В таком случае закоммить это изменение, снова push, снова проверь совпадение HEAD с `origin`, затем повтори deploy.

## 7. Проверка Живого Сайта

Проверь HTTP-ответ с cache-busting параметром по короткому хэшу коммита:

```bash
SHORT_SHA="$(git rev-parse --short HEAD)"
curl -fsSI "https://gigahrush.bileter.workers.dev/?v=$SHORT_SHA"
curl -fsS "https://gigahrush.bileter.workers.dev/?v=$SHORT_SHA" | head -c 1000
```

Ожидается:

- HTTP `200`;
- HTML игры, не Cloudflare error page;
- в теле есть признаки актуального билда: `ГИГАХРУЩ`, `gigahrush`, `НЕТ-СФЕРА` или другой текст из текущей сборки.

Проверь Cloudflare API:

```bash
curl -fsS "https://gigahrush.bileter.workers.dev/api/net/stats" | head -c 500
```

Ожидается JSON-ответ, а не HTML, не 404 и не Cloudflare auth/error page.

Если нужно убедиться визуально после UI/render изменений, открой production URL или запусти smoke. Для canvas/WebGL изменений не ограничивайся только `curl`.

## 8. itch.io Upload Notes

Каждый коммит должен создавать новый ZIP:

```txt
itch/gigahrush-itch.zip
```

Но загрузка на itch.io может требовать браузерной авторизации. Если пользователь просит именно `комить`, минимально обязательное действие - собрать новый ZIP и указать его путь в отчете. Если пользователь просит `комить и залить на itch`, тогда:

1. Открой `https://itch.io/game/edit/4587160`.
2. Загрузи `itch/gigahrush-itch.zip`.
3. Включи HTML/browser play для файла.
4. Проверь публичную страницу `https://tenevik.itch.io/gigahrush`.

Настройки itch.io описаны в `itch/ITCH_UPLOAD_NOTES.txt` и `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`.

## 9. Итоговый Отчет Пользователю

В конце коротко сообщи:

- commit hash;
- что push в GitHub выполнен;
- что `itch/gigahrush-itch.zip` собран;
- что `npm run check` прошел или какие проверки были запущены;
- что Wrangler был под аккаунтом `jirnyak`;
- что `https://gigahrush.bileter.workers.dev` отвечает свежей сборкой;
- если что-то не удалось, точный блокер и последний успешный шаг.

Пример:

```txt
Готово: commit 1234abc отправлен в origin/main. `npm run check` и `npm run itch:build` прошли, ZIP лежит в `itch/gigahrush-itch.zip`. Wrangler показал аккаунт jirnyak, `npm run cf:deploy` завершился, `https://gigahrush.bileter.workers.dev/?v=1234abc` и `/api/net/stats` отвечают 200.
```
