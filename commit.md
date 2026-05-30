# Commit Runbook For Agents

> Центральный документ релизного цикла.
>
> Роль: описывает commit, validation, Cloudflare deploy, itch.io artifact, Pikabu/GamePush artifact, public build checks and release discipline. Использовать только когда пользователь явно просит commit/release/deploy/publish workflow.

Эта инструкция применяется, когда пользователь дает короткую команду вроде `комить`, `сделай коммит`, `commit`, `закоммить и выложи`.

Цель каждого релизного коммита для ГИГАХРУЩ:

1. Собрать и проверить HTML5 upload artifacts: itch.io ZIP, MyIndie RU ZIP-кандидат и Pikabu/GamePush ZIP-кандидат.
2. Закоммитить проект и отправить коммит в GitHub.
3. Убедиться, что Cloudflare Worker под аккаунтом `jirnyak` отдает свежую сборку на `https://gigahrush.bileter.workers.dev`.
4. Обновить или проверить публичные площадки только когда пользователь явно просит upload/publish; обычный `комить` не означает blind-click в itch.io, MyIndie или Pikabu Games.

Не останавливайся после локального коммита. Команда `комить` означает весь релизный цикл ниже.

## Быстрый Маршрут

```bash
git status --short
npm run check
npm run itch:build
unzip -l itch/gigahrush-itch.zip | sed -n '1,40p'
npm run pikabu:build
unzip -l pikabu/gigahrush-pikabu.zip | sed -n '1,40p'
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

Перед PR/portal действиями сверяй актуальную операционную информацию с `Docs/PRCampaign/KPI.md` и `Docs/PRCampaign/`, особенно:

- `Docs/PRCampaign/campaign_plan_ru.md`;
- свежий `Docs/PRCampaign/kpi_report_*.md`;
- `Docs/PRCampaign/PR_16.md` для MyIndie;
- `Docs/PRCampaign/PR_29_pikabu_gamepush_readiness.md`, `Docs/PRCampaign/PR_29_pikabu_games_prep.md` и `Docs/PRCampaign/pikabu_games_pre_submit_qa_2026-05-27.md` для Pikabu/GamePush.

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

## 3. HTML5 Upload Artifacts

Релизный коммит теперь должен оставлять локально готовыми три upload-кандидата:

- itch.io: `itch/gigahrush-itch.zip`;
- MyIndie RU: тот же текущий HTML5 ZIP `itch/gigahrush-itch.zip`, потому что отдельного `myindie:build` скрипта сейчас нет;
- Pikabu Games/GamePush: `pikabu/gigahrush-pikabu.zip`.

Эти каталоги находятся в `.gitignore`, поэтому ZIP обычно не коммитятся. Это релизные артефакты для ручной загрузки/проверки, а не исходный код.

### 3.1 itch.io ZIP

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

Если пользователь отдельно просит загрузить файл на itch.io, используй `itch/gigahrush-itch.zip` и настройки из `itch/ITCH_UPLOAD_NOTES.txt` и `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`.

### 3.2 MyIndie RU ZIP-Кандидат

MyIndie сейчас является основной RU/CIS игровой страницей:

```txt
https://myindie.ru/games/game/gigahrush
```

Для MyIndie используй свежий `itch/gigahrush-itch.zip`, собранный через `npm run itch:build`. Не придумывай отдельную сборку и не добавляй `myindie:build`, пока в репозитории нет измеренной причины. Перед ручным обновлением MyIndie проверь:

```bash
unzip -l itch/gigahrush-itch.zip | sed -n '1,80p'
```

Критично то же самое: `index.html` должен лежать в корне ZIP.

Если пользователь просит только `комить`, не заходи в MyIndie dashboard и не обновляй страницу. В итоговом отчете достаточно указать, что MyIndie RU upload-кандидат - это свежий `itch/gigahrush-itch.zip`. Если пользователь явно просит `обновить MyIndie`, используй существующую опубликованную карточку, не создавай duplicate listing, загружай текущий ZIP, проверяй публичную страницу, Web iframe, ссылку на MyIndie в PR/KPI docs и не делай final publish/update без preview.

Актуальные операционные факты для MyIndie держатся в `Docs/PRCampaign/KPI.md`, `Docs/PRCampaign/campaign_plan_ru.md`, `Docs/PRCampaign/PR_16.md` и свежем `Docs/PRCampaign/kpi_report_*.md`.

### 3.3 Pikabu Games / GamePush ZIP

Собери отдельный Pikabu/GamePush artifact:

```bash
npm run pikabu:build
```

Ожидаемый результат:

- `pikabu/index.html`;
- `pikabu/gigahrush-pikabu.zip`;
- `pikabu/PIKABU_UPLOAD_NOTES.txt`.

Проверь форму архива:

```bash
unzip -l pikabu/gigahrush-pikabu.zip | sed -n '1,80p'
```

Критично: `index.html` должен лежать в корне ZIP. `pikabu:build` должен включать strict portal metadata только в скопированный `pikabu/index.html`, а не загрязнять обычный `dist/index.html`.

Без `GAMEPUSH_PROJECT_ID`/`GAMEPUSH_PUBLIC_TOKEN` или `GP_PROJECT_ID`/`GP_PUBLIC_TOKEN` это только no-credential QA-кандидат. Для реальной отправки нужны владелец/юридический статус, проект GamePush, поле игрока `progress`, реальные public credentials, `npm run check:browser`, iframe SDK save/load QA, финальные иконки/обложка/скриншоты и ручной preview в форме Pikabu Games.

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

## 8. Публичные Площадки И Upload Notes

Каждый релизный коммит должен создавать новые локальные upload-кандидаты:

```txt
itch/gigahrush-itch.zip
pikabu/gigahrush-pikabu.zip
```

MyIndie RU использует текущий `itch/gigahrush-itch.zip` как HTML5 ZIP-кандидат.

Загрузка на публичные площадки может требовать браузерной авторизации, owner/legal confirmation, captcha, preview или final submit. Если пользователь просит именно `комить`, минимально обязательное действие - собрать ZIP-кандидаты и указать их пути в отчете. Если пользователь просит `комить и залить на itch`, тогда:

1. Открой `https://itch.io/game/edit/4587160`.
2. Загрузи `itch/gigahrush-itch.zip`.
3. Включи HTML/browser play для файла.
4. Проверь публичную страницу `https://tenevik.itch.io/gigahrush`.

Настройки itch.io описаны в `itch/ITCH_UPLOAD_NOTES.txt` и `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`.

Если пользователь просит `комить и обновить MyIndie`, тогда:

1. Открой существующую карточку MyIndie `https://myindie.ru/games/game/gigahrush` или edit URL из актуального PRCampaign отчета.
2. Загрузи свежий `itch/gigahrush-itch.zip`.
3. Не создавай новую карточку и не меняй публичную ссылку без явной причины.
4. Проверь публичную страницу, Web iframe, кликабельные ссылки и что старая карточка осталась под Tenevik Games/TENEVIK.

Если пользователь просит `комить и подготовить/отправить на Пикабу Игры`, тогда:

1. Сверь `Docs/PRCampaign/pikabu_games_pre_submit_qa_2026-05-27.md`.
2. Собери `pikabu/gigahrush-pikabu.zip` через `npm run pikabu:build`, при реальной отправке только с owner-provided GamePush public credentials в локальном окружении.
3. Проверь root `index.html`, strict portal metadata, отсутствие встроенных секретов и отсутствие portal meta в обычном `dist/index.html`.
4. Запусти `npm run check:browser`, затем реальный GamePush/Pikabu iframe save/load/pause/audio/content QA.
5. Не нажимай final submit, не принимай legal/payment terms и не создавай GamePush/Pikabu проект от имени владельца без явной команды.

## 9. Итоговый Отчет Пользователю

В конце коротко сообщи:

- commit hash;
- что push в GitHub выполнен;
- что `itch/gigahrush-itch.zip` собран;
- что MyIndie RU upload-кандидат использует свежий `itch/gigahrush-itch.zip`;
- что `pikabu/gigahrush-pikabu.zip` собран или какой Pikabu/GamePush блокер остался;
- что `npm run check` прошел или какие проверки были запущены;
- что Wrangler был под аккаунтом `jirnyak`;
- что `https://gigahrush.bileter.workers.dev` отвечает свежей сборкой;
- если что-то не удалось, точный блокер и последний успешный шаг.

Пример:

```txt
Готово: commit 1234abc отправлен в origin/main. `npm run check`, `npm run itch:build` и `npm run pikabu:build` прошли. itch/MyIndie ZIP-кандидат лежит в `itch/gigahrush-itch.zip`, Pikabu/GamePush ZIP-кандидат лежит в `pikabu/gigahrush-pikabu.zip`. Wrangler показал аккаунт jirnyak, `npm run cf:deploy` завершился, `https://gigahrush.bileter.workers.dev/?v=1234abc` и `/api/net/stats` отвечают 200.
```
