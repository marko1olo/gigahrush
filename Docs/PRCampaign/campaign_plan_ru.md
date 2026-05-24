# PR Campaign Plan: ГИГАХРУЩ

Дата запуска: 2026-05-22.

Цель первого прохода: не массовая рассылка, а аккуратная кампания вокруг playable browser build: короткие посты там, где self-promo разрешен, страницы в каталогах браузерных/инди-игр, и точечный pitch медиа/кураторам.

Основные ссылки:

- itch.io: https://tenevik.itch.io/gigahrush
- Онлайн-версия: https://gigahrush.bileter.workers.dev
- Fandom archive: https://samosborarchive.fandom.com/ru/wiki/ГИГАХРУЩ
- Fandom samosb0r: https://samosb0r.fandom.com/ru/wiki/ГИГАХРУЩ
- Fandom archive EN: https://samosborarchive-en.fandom.com/wiki/GIGAH_RUSH
- Reddit r/playmygame: https://www.reddit.com/r/playmygame/comments/1tku91k/gigahrush/
- IndieDB: https://www.indiedb.com/games/gigahrush
- Game Jolt: https://gamejolt.com/games/gigahrush/1072064
- iDev.Games: https://idev.games/game/gigah-rush
- MyIndie: https://myindie.ru/games/game/gigahrush
- 2ch /b/: https://2ch.org/b/res/333348764.html

Текущий релизный snapshot на 2026-05-23:

- `itch/gigahrush-itch.zip`: 4 999 557 bytes, SHA-256 `fa63dd2be47292814989234482f40597b23fa58df2ec3ab823992953f6c66321`.
- `dist/index.html`: 10 673 018 bytes, SHA-256 `732ced4bc2d7bcf91edaec7382ca67d5f4707d1e75ed3c5a29f0ed5df3424d18`.
- Cloudflare build: https://gigahrush.bileter.workers.dev отдает 200, публично не содержит `noindex`, размер и SHA-256 ответа совпадают с локальным `dist/index.html`.
- itch.io page: https://tenevik.itch.io/gigahrush отдает 200, видна из публичного профиля Tenevik Games, обновлена `23 May 2026 @ 20:04 UTC`, содержит playable iframe, но публичный HTML все еще содержит `noindex` по проверке 2026-05-23 21:03 UTC. Внутренний поиск itch по `gigahrush`, `GIGAH|RUSH` и `ГИГАХРУЩ` не показывает страницу Tenevik. Dashboard через Opera GX проверен: проект published/active, не restricted, не unlisted, current HTML ZIP ready/embedded, cover/screenshots есть, Metadata соседние разделы сохранены; support email отправлен в `support@itch.io` из `jirnyak@gmail.com` в 20:22 UTC. Devlog permalink `/devlog/1530909/-` теперь login-gated как flagged for moderator review. Public itch iframe hash `6bc3eff141f26853f32c460db5c231d8b6639a54cd22a8deb6e826b3b289374c` не совпадает с локальным `dist/`/ZIP hash `732ced4bc2d7bcf91edaec7382ca67d5f4707d1e75ed3c5a29f0ed5df3424d18`; перед новыми sync/upload утверждениями проверить intended build.
- Reddit после PR 13: r/PBBG, r/WebGames и r/Games Indie Sunday опубликованы 2026-05-24; live comments corrected with playable links plus direct GIF/screenshot URLs; r/IndieDev удален модерацией/автомодерацией. PBBG.com `/games` на 2026-05-24 17:43 UTC уже публично показывает ссылку на r/PBBG пост, но `/games/gigahrush` еще `404`. Следующее действие - monitoring/replies only, без нового Reddit-поста и без immediate repost.
- Game Jolt: опубликован публично 2026-05-23 18:50 UTC / 19:50 BST и синхронизирован с текущим ZIP 2026-05-23 20:17 UTC / 21:17 BST. Package `1093814`, release `1474942`, version `0.2.0`, build `1960153`; public API на 21:03 UTC показывает package public/active, `profileCount 2`, `playCount 0`, `downloadCount 0`, `like_count 1`, `follower_count 0`, один gallery screenshot. PR 14 browser check подтвердил два публичных поста: полный media update `https://gamejolt.com/p/media-update-after-first-feedback-samosbor-gifs-screenshots-expe-ff7fm7k8` и короткий пост `https://gamejolt.com/p/media-update-after-first-community-feedback-preparation-trade-and-mbgfde7a`. Короткий пост исправлен owner-comment с playable links, GIF/contact-sheet media URLs и конкретными gameplay facts; браузер показал `1 comment`.
- iDev.Games: публичный листинг https://idev.games/game/gigah-rush подтвержден 2026-05-23 21:21 UTC: `200 OK`, title `Gigah Rush - Free Online Browser Game`, `noindex` нет, SEO description/tags есть. Logged-in edit page пишет `Public: This game has been released and is visible to everyone!`; embed ведет на `/appvert/game/4008/game66400/`, где HTML игры открывается с title `ГИГАХРУЩ - САМОСБОР`, canvas content и размером `10 673 937` bytes.
- MyIndie: публичный playable листинг https://myindie.ru/games/game/gigahrush опубликован 2026-05-23 21:42 UTC / 22:42 BST после owner public-upload инструкции. Загружены cover, 3 screenshots и `itch/gigahrush-itch.zip` (`4 999 557` bytes); страница показывает `WEB VERSION`, version `0.2.0`, Web (HTML5), engine `Another`, RU/EN, genres Shooter/RPG/Action/Survival/Horror и дату `23.05.2026`; Web iframe открывает загруженный ZIP build.
- DTF: по owner decision 2026-05-23 считается успешным каналом. Fresh public recheck 2026-05-24 17:43 UTC / 18:43 BST: post published/not removed, `2060` views, `529` hits, `13` comments, `10` favorites, `7` reactions, `total=2619`. Рабочий паттерн: UGC/devlog с медиа, понятной playable-петлей, прозрачным developer disclosure, прямыми ссылками и конкретными вопросами к игроку.
- `npm run check:release` прошел на повторе: 12 screenshots, 7 root-relative files, 0 itch-pack warnings; size warnings are non-blocking.
- PR/upload archive manifest: `Docs/PRCampaign/release_artifacts_2026-05-23.md`; generated ZIPs are under `tmp/prcampaign_2026-05-23/`.
- Owner-updated best media set: `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/`. Для новых постов, питчей и портальных галерей брать GIF/PNG оттуда; квадратный обзор - `contact_sheet_3x3.png` (`contact_sheet_png.png` оставлен как тот же 1920x1920 файл для старых ссылок).
- 2ch /b/: old live thread `https://2ch.org/b/res/333348764.html` is now archived/404. Public recheck 2026-05-24 17:43 UTC redirected to `https://2ch.org/b/arch/2026-05-24/res/333348764.html` and returned `404`. Earlier useful themes remain: неудобно играть / UI-first-run friction, вопрос про движок, непонятная цель и PvP expectation, AI-content suspicion, request for more human/social monster archetypes. Do not duplicate, bump or add link-only mirror replies.

## Запущено

| Статус | Площадка | URL | Что сделано |
| --- | --- | --- | --- |
| Done | Самосбор Archive Fandom | https://samosborarchive.fandom.com/ru/wiki/ГИГАХРУЩ | Создана страница игры. |
| Done | samosb0r Fandom | https://samosb0r.fandom.com/ru/wiki/ГИГАХРУЩ | Создана страница игры. |
| Done | Self-Assembly Wiki EN / Fandom | https://samosborarchive-en.fandom.com/wiki/GIGAH_RUSH | Создана английская страница игры с инфобоксом и контекстом Self-Assembly. Правка 2026-05-23 21:19 UTC, rev `420`, заменила неактивный Newgrounds на live Game Jolt; API extlinks теперь: itch.io, онлайн-версия, Telegram, DTF, GameDev.ru, Game Jolt. |
| Done | Архив Самосбора / Игры по вселенной | https://samosborarchive.fandom.com/ru/wiki/Игры_по_вселенной | `ГИГАХРУЩ` добавлен в список игр по вселенной; ссылка ведет на itch.io и внутреннюю страницу `[[ГИГАХРУЩ]]`. |
| Done | Self-Assembly Games / Fandom EN | https://samosborarchive-en.fandom.com/wiki/Self-Assembly_Games | `GIGAH RUSH` добавлен в английский список Self-Assembly games; ссылка ведет на itch.io и внутреннюю страницу `[[GIGAH RUSH]]`. |
| Blocked | ShoutWiki Самосбор | https://samosbor.shoutwiki.com/wiki/ГИГАХРУЩ | Публикация невозможна: abuse filter `запрет правок` с правилом `1==1` запрещает все правки. |
| Ready | KPI agent brief | `KPI.md` | Создан бриф агента мониторинга: опубликованные поверхности, KPI, good/bad signs, cadence daily/weekly/incident, шаблон отчета и текущие блокеры. |
| Done | KPI report 2026-05-22 | `Docs/PRCampaign/kpi_report_2026-05-22.md` | Первый отчет кампании: itch/Cloudflare/Newgrounds/DTF/GameDev/Fandom/IndieDB/iDev статусы, good/bad signs, fix queue и owner-needed блокеры. |
| Ready | Link opportunities | `Docs/PRCampaign/link_opportunities_2026-05-22.md` | Список адекватных мест для ссылок: P0 wiki lists, осторожные wiki-discussion варианты, внешние devlog/submission площадки, готовые RU/EN wikitext snippets. |
| Ready | Copy pack | `Docs/PRCampaign/copy_pack_ru.md` | Готовы RU/EN посты, pitch, письма и one-liners. |
| Ready | Wiki page drafts | `Docs/WikiPages/` | Готовы wikitext-заготовки под вики. |
| Waiting | itch.io indexing | https://itch.io/docs/creators/getting-indexed | Снята галка `Disable new downloads & purchases`, dashboard теперь проверен через Opera GX: проект published/active, не restricted, не unlisted, ZIP ready/embedded. `noindex` все еще остается после recheck 2026-05-23 21:03 UTC; support email отправлен в 20:22 UTC. |
| Support sent | itch.io listing incident | `Docs/PRCampaign/itch_listing_incident_2026-05-23.md` | Public recheck 2026-05-23 21:03 UTC: страница `200 OK`, playable/profile-visible, но HTML содержит `noindex`, search по точному названию не выводит Tenevik page, devlog permalink `/devlog/1530909/-` возвращает `404` и login-gated moderator-review message. Release info, Classification, Engines & tools, External links проверены/сохранены; Promo images optional и пустые, но cover + 14 screenshots/GIFs есть. Письмо в `support@itch.io` отправлено из `jirnyak@gmail.com`; не пересоздавать страницу и не дублировать itch posts. |
| Done | itch.io Release Announcements | https://itch.io/t/6385827/gigahrush-free-browser-survival-horror-in-an-endless-concrete-apartment-block | Опубликован и отредактирован пост из `Docs/PRCampaign/itch_release_announcement.md`: исправлен Markdown, GIF вставлен как изображение. |
| Done / permalink support | itch.io Devlog | https://tenevik.itch.io/gigahrush/devlog | Опубликован launch-devlog из `Docs/PRCampaign/itch_devlog_launch_ru.md`; тип `Major Update or Launch`. Public recheck 2026-05-23 21:03 UTC: index живой и показывает launch-post, но прямой URL `https://tenevik.itch.io/gigahrush/devlog/1530909/-` возвращает `404` и сообщает, что страница flagged for moderator review / требует login. Devlog editor проверен: пост `Published`, comments enabled, отдельного slug/permalink поля нет; не менять публичный заголовок ради латинского слага без owner/support ok. |
| Done | Reddit r/playmygame | https://www.reddit.com/r/playmygame/comments/1tku91k/gigahrush/ | Пользователь опубликовал новый non-NSFW self-post: developer affiliation раскрыта, ссылки на itch.io и direct build есть, игра подана как free browser survival horror. |
| Done | HTML5 portal preflight | `itch/gigahrush-itch.zip` | `npm run check:release` прошел на повторе; текущий ZIP: 4 999 557 bytes, SHA-256 `fa63dd2be47292814989234482f40597b23fa58df2ec3ab823992953f6c66321`, 12 screenshots, 7 root-relative files, 0 itch-pack warnings. |
| Conditional update | GameDev.ru / Проекты / Оцените | https://gamedev.ru/projects/forum/?id=295485 | Public recheck 2026-05-23 18:12 UTC: тема жива; есть конкретный отзыв `#1` про темно-синий зависший-looking экран в direct online build и просьба добавить ProgressBar, ответ `#2` уже дан про Cloudflare/VPN. Следующий reply/update только если признает этот риск и ведет в itch.io как primary link; не делать generic bump. |
| Done / successful / media fixed | DTF / Инди | https://dtf.ru/indie/5077801-gigahrush-brauzernyj-survival-horror | Пост отредактирован 2026-05-23 20:44 UTC / 21:44 BST после комментариев: добавлена галерея из 5 медиа (GIF с моргающими глазами + 4 скриншота), itch.io/Telegram/direct build превращены в кликабельные DTF redirect links. Public API recheck 2026-05-23 21:44 UTC / 22:44 BST: 1999 views, 472 hits, 12 comments, 10 favorites, 6 reactions, `total=2499`; публичная страница показывает примерно `2.4K` views. Дальше только мониторинг и ответы на конкретный фидбек; успех использовать как модель для похожих UGC/devlog площадок. |
| Done / live / monitor | 2ch /b/ | https://2ch.org/b/res/333348764.html | Тред опубликован с developer disclosure, direct build + itch links and prepared media pack attachments. Public recheck 2026-05-23 23:26 UTC: 14 posts, 11 files, 6 posters, not closed. Дальше только мониторинг и ответы на конкретный фидбек; не создавать дубль, не бампать, не просить лайки/репосты/голоса и не сыпать зеркалами без запроса. |
| Blocked | Newgrounds | https://www.newgrounds.com/portal/view/1033564 | URL теперь редиректит на https://www.newgrounds.com/portal/rip/1033564. Существующий проект `7759223` доступен в редакторе, но штатный browser upload через `<input type=file>` и прямой `/parkfile` attach сохраняют свежий `itch/gigahrush-itch.zip` как `9B`. Битый attachment удален; публиковать нельзя, пока preview не покажет реальный архив `4.77 MiB` / `4 999 557` bytes. |
| Submitted | GamHub | https://gamhub.net/website_submit/ | Отправлена карточка `GIGAH\|RUSH` через публичную форму: itch.io как основной URL, direct browser build и Telegram в описании; категории Adventure/Shooter/Survival/Horror/Simulation, Best Browser Games, free-to-play. Сервер вернул `{"code":200,"msg":"Submit success"}`; follow-up 2026-05-23 21:26 UTC: `/game/gigahrush/`, `/game/gigah-rush/` и sitemap не дают листинг (`404` / нет `gigahrush`); contact/about не найдены, только submit form. |
| Done / browser check | IndieDB | https://www.indiedb.com/games/gigahrush | Создан листинг, загружены profile assets и 5 gameplay screenshots. Страница изображений: https://www.indiedb.com/games/gigahrush/images/gigahrush-gameplay-screenshots. Shell fetch остается Cloudflare `403`, но Chrome browser/account check 2026-05-23 21:23-21:24 UTC открыл game page с title `GIGAH\|RUSH Web game - IndieDB` и screenshot page с title `GIGAH\|RUSH gameplay screenshots image - IndieDB`. |
| Done / live | DiscoverGG | https://discovergg.com/game/gigahrush | Сабмит отправлен; public recheck 2026-05-23 21:03 UTC: canonical `/game/gigahrush` возвращает `200 OK`, title `GIGAH\|RUSH — Free Browser Game`, `robots: index, follow`, play link ведет на itch.io, счетчик показывает `1 votes`, home page содержит ссылку на `/game/gigahrush`. `/game/gigah-rush` остается неканоничным/404. |
| Submitted | Fake Portal | https://fakeportal.com/submit-a-game/ | Заявка отправлена через авторизованную форму: `Game submitted for review!`, `game_id: 10841`, статус `pending`, title `GIGAH\|RUSH`. Logged-in dashboard check 2026-05-23 21:22 UTC: `Submitted Games (1)`, `GIGAH\|RUSH`, status `Pending`, date `May 23, 2026`, доступен только `Preview`; public `/games/gigahrush/` все еще 404. |
| Submitted | FreeZonePlay | https://freezoneplay.com/contact-us/ | Заявка отправлена через Contact Form 7; ответ `mail_sent`. WP admin creation недоступен (`403`); follow-up 2026-05-23 21:26 UTC: `/gigahrush/`, `/gigah-rush/`, `/submit-game/`, `/add-game/` дают 404; WP REST не показывает custom game post type. |
| Support sent | Gamemoor | https://gamemoor.com/contact | Аккаунт `jirnyak` авторизован, но `/developer` редиректит на главную, а `/submit`, `/games/add`, `/dashboard`, `/my-games` дают `404`. Gmail support request отправлен на `contact@gamemoor.com` 2026-05-23 21:35 BST; public contact page не показывает email, поэтому ждать reply/bounce и при необходимости повторить через форму. |
| Blocked | Free Indie Games | https://www.freeindiegames.org/submit-game/ | Страница показывает сырой shortcode `[ninja_forms_display_form id=1]`; рабочей формы нет, Ninja Forms REST route возвращает `404 rest_no_route`. Нужен repair формы владельцем сайта или email/contact. |
| Blocked / not submitted | Querygame | https://querygame.com/submit | Public submit flow ранее уперся в `/api/submit-game` с ответом `405`, поэтому submission не засчитан. Follow-up 2026-05-23 18:00 UTC: homepage live, `/games/gigahrush`, `/games/gigah-rush` и `/search?q=gigahrush` возвращают Querygame 404. |
| Sent batch 1 | Email-only pitch wave | Alpha Beta Gamer, Free Game Planet, Games Pending | Chrome Apple Events подтвержден; Gmail DOM `Send` показал `Message sent` для `Admin@alphabetagamer.com`, `admin@freegameplanet.com` и `gamespending@gmail.com` 2026-05-23. Быстрый follow-up не делать. |
| Sent batch 2 | Email-only pitch wave 2 | Armor Games, TapCraftBox, Indie Games Plus | Gmail DOM `Send` показал `Message sent` для `mygame@armorgames.com` 21:33 BST, `support@tapcraftbox.com` 21:34 BST и `editors@indiegamesplus.com` 21:35 BST. Indie Games Plus получил tailored pitch; быстрый follow-up не делать. |
| Sent batch 3 | Targeted media/editorial wave | VK Play Media, HorrorFam, Indie Game Buzz, Into Indie Games | Gmail DOM `Send` после проверки полей показал отправку для `mediavkplay@vkteam.ru` 2026-05-24 00:28 BST, `lauren@horrorfam.com` 00:29 BST, `games@indiegamebuzz.com` 00:30 BST и `info@intoindiegames.com` 00:31 BST; Gmail search подтвердил по одному sent conversation на каждый адрес. Быстрый follow-up не делать. |
| Done / public playable / synced | Game Jolt | https://gamejolt.com/games/gigahrush/1072064 | Страница `GIGAH\|RUSH` опубликована как `Early Access` / `Published`; description, Teen/non-adult maturity, thumbnail `50560626`, header `50560651`, screenshot `2181594`/`50560706` сохранены. Package `1093814`, release `1474942`, version `0.2.0`, build `1960153`; public API recheck 21:03 UTC `200`, package public/active, `profileCount 2`, `playCount 0`, `downloadCount 0`, `like_count 1`, `follower_count 0`; direct served `index.html` matches current `dist/index.html` hash and opens `ГИГАХРУЩ - САМОСБОР` with visible canvases. |
| Done / public playable | iDev.Games | https://idev.games/game/gigah-rush | Public listing confirmed 2026-05-23 21:21 UTC: `200 OK`, title `Gigah Rush - Free Online Browser Game`, no `noindex`, SEO description/tags and embed `/embed/gigah-rush`. Logged-in edit page says `Public: This game has been released and is visible to everyone!`; embed game HTML `/appvert/game/4008/game66400/` returns title `ГИГАХРУЩ - САМОСБОР` with canvas content. |
| Done / public playable | MyIndie | https://myindie.ru/games/game/gigahrush | Опубликован публичный Web (HTML5) листинг `ГИГАХРУЩ`: RU description, links to itch/direct/Telegram, engine `Another`, RU/EN, genres Shooter/RPG/Action/Survival/Horror, cover, 3 screenshots and current `itch/gigahrush-itch.zip` (`4 999 557` bytes). Browser/public check showed `WEB VERSION`, version `0.2.0`, date `23.05.2026` and Web iframe for the uploaded ZIP. |
| Application submitted | Kongregate | https://www.kongregate.com/en/developer/apply | Developer Application submitted 2026-05-23 21:23 UTC; confirmation says this is Step 1 and Kongregate will review/respond. No public game page yet; wait for approval before Alpha/upload. |
| Ready | Next wave targets | `Docs/PRCampaign/next_wave_targets_2026-05-23.md` | Добавлен новый пакет целей: Armor Games, TapCraftBox, Kongregate, Game Jolt, iDev.Games, Gamemoor support, Reddit follow-up и skip/low-fit список. |
| Done / fix pass | PR 14 | `Docs/PRCampaign/PR_14.md` | 2026-05-24 17:32-17:44 UTC: 6-agent sweep integrated; Game Jolt short post fixed by visible media/playable owner comment; full Game Jolt media update live; IndieDB news awaiting authorisation; HTML5GameDevs attempted but requires registration/password/Terms; DevTribe add path `403`; Pikabu login pending. |

## Волна 0: привести главную страницу в порядок

| Приоритет | Площадка | URL | Формат | Ограничения | Действие |
| --- | --- | --- | --- | --- | --- |
| A | itch.io page indexing | https://itch.io/docs/creators/getting-indexed | Проверка индексации/quality | Проект должен быть public, без `Disable new downloads & purchases` / `Unlisted in search & browse`, с cover, playable/downloadable build, корректной metadata и без spam/NSFW-mislabel. | Checklist/dashboard/Metadata проверены через Opera GX; support email отправлен в `support@itch.io` из `jirnyak@gmail.com` 2026-05-23 20:22 UTC. Следующее действие: ждать support/indexing и recheck `noindex`/search. |
| A | itch.io HTML5 build | https://itch.io/docs/creators/html5 | Browser playable page | ZIP с `index.html`; корректная встраиваемая игра; желательно без внешних зависимостей. | Уже работает как HTML5 page; сохранить как primary link. |
| A | Press kit URL | `itch_page_pack/` | One-stop facts/assets | Медиа не должны искать скриншоты и GIF вручную. | Собрать публичный press-kit page или архив: 5-8 скриншотов/GIF, logo/capsule, fact sheet RU/EN, contact. |

## Волна 1: безопасные объявления

| Приоритет | Площадка | URL | Формат | Ограничения | Действие |
| --- | --- | --- | --- | --- | --- |
| A | itch.io Release Announcements | https://itch.io/board/10022/release-announcements | Топик с ссылкой, summary, картинкой/GIF | Правила требуют не link dump: ссылка на itch, краткое описание, хотя бы одно изображение/видео, без накруток и спама. | Опубликовать один release-topic и отвечать на комментарии. |
| A | DTF / Инди | https://dtf.ru/indie/5077801-gigahrush-brauzernyj-survival-horror | Уже опубликованный успешный devlog | Не делать чистый рекламный link-drop; DTF запрещает спам и агрессивное продвижение. | Сделано 2026-05-23 20:44 UTC: в сам пост добавлены скриншоты/GIF и кликабельные ссылки. Fresh API 21:44 UTC: 1999 views / 472 hits / 12 comments / 10 favorites / 6 reactions / `total=2499`. Дальше только мониторинг комментариев; не делать новый пост и не бампить ссылкой. |
| B | GameDev.ru / Проекты | https://gamedev.ru/projects/forum/?id=295485 | Уже опубликованная тема `Оцените` | Нужны описание, скриншоты, ссылка; поднятие темы не чаще разумного интервала; уже есть жалоба на stuck-looking direct build. | Conditional/no-go для generic update; если отвечать, то сначала признать loading/progress issue, попросить проверить itch.io билд и конкретно UI/первые минуты. |
| B | Reddit r/playmygame | https://www.reddit.com/r/playmygame/ | Media post + комментарий с описанием | Игра должна быть playable for free, нужен direct link, описание, flair, не чаще раза в месяц. | Постить EN-версию с GIF, затем первым комментарием добавить описание и ссылки. |
| C | Reddit r/IndieDev | https://www.reddit.com/r/IndieDev/ | GIF/image, dev-focused angle | Аудитория скорее разработчики; links хуже работают, нужен общий смысл/фидбек. | Постить не "play my game", а вопрос по генерации/визуалу Самосбора. |
| B | Reddit r/indiegames | https://www.reddit.com/r/indiegames/ | Gameplay GIF/video | Самопромо допустимо в разумных пределах, но нельзя маскировать рекламу под пустой feedback-bait. | Один честный пост с названием игры, GIF и ссылкой в комментарии. |
| B | Reddit r/WebGames | https://www.reddit.com/r/WebGames/ | Direct browser game link | Общая антиспам-логика Reddit; не кросспостить одинаковый текст пачкой. | Подходит из-за no-install browser build. |
| B | Reddit r/Games Indie Sunday | https://www.reddit.com/r/Games/ | Indie Sunday self-post | Только в подходящий weekly thread/формат, с сильным описанием и видео/GIF. | Использовать после itch announcement и первого social proof. |

## Волна 2: каталоги и браузерные порталы

| Приоритет | Площадка | URL | Формат | Ограничения | Действие |
| --- | --- | --- | --- | --- | --- |
| A | IndieDB | https://www.indiedb.com/games/gigahrush | Страница игры, новости/updates | Нужна учетная запись; страница проекта и материалы. | Листинг создан; shell follow-up упирается в Cloudflare `403`. PR 14 browser/account check открыл news article `https://www.indiedb.com/games/gigahrush/news/gigahrush-clearer-media-for-the-browser-survival-horror-build`; статус `currently awaiting authorisation`, обычно около одного дня. |
| A | Newgrounds | https://www.newgrounds.com/projects/games/7759223/details | HTML5 upload | Нужен ZIP с `index.html` в корне; игра должна работать в браузере, без pop-ups и правовых проблем. | Сейчас blocked: upload flow сохраняет архив как `9B`; не публиковать, пока Newgrounds не принимает реальный ZIP и preview не играет. |
| A | GamHub | https://gamhub.net/website_submit/ | Browser-game directory submission | Форма публичная, review 24-48 часа; не принимает political/porn/terrorism content. | Отправлено 2026-05-22; follow-up 2026-05-23 21:26 UTC все еще без public URL, sitemap без `gigahrush`, contact/about не найдены. Проверить еще раз через 48-72h, не дублировать same-day. |
| A | DiscoverGG | https://discovergg.com/game/gigahrush | Browser-game discovery listing | Уже публично; canonical `/game/gigahrush`, play link на itch.io. | Мониторить наличие страницы и целостность ссылок; больше не pending. |
| B | Gamemoor | https://gamemoor.com/contact | Browser-game publishing platform | Developer portal у авторизованного аккаунта редиректит на главную. | Написать через contact: logged-in account `jirnyak`, `/developer` redirects to homepage, нужен submit URL/developer access. |
| B | PLRun | https://plrun.com/plrun-for-developers/ | HTML5/WebGL portal | Старый developer URL на 2026-05-23 вернул `410/Page Not Found`; возможная новая точка `https://plrun.com/developers/`. Mobile/touch и family-friendly fit слабый. | Не отправлять как обычный P0 pitch; вернуться только после подтверждения актуального contact/developer path и честного content note. |
| B | FreeZonePlay | https://freezoneplay.com/contact-us/ | Email/contact submission | Принимают HTML5/WebGL; требуют hosted link/ZIP, details, screenshots, studio/social links. | Заявка отправлена через contact form; follow-up 2026-05-23 21:26 UTC без public listing, guessed submit/add-game paths 404, WP REST без game post type. Ждать email/listing, не слать same-day duplicate. |
| B | Free Indie Games | https://www.freeindiegames.org/submit-game/ | Editorial review/contact form | Просят genre, length, publisher, state alpha/beta и детали; review не гарантирован. | Blocked: submit form broken/raw shortcode; нужен repair сайта или email. |
| B | Fake Portal | https://fakeportal.com/submit-a-game/ | Indie directory developer submission | Нужен вход; review после submission. | Заявка отправлена, `game_id: 10841`, status `pending`; logged-in dashboard 2026-05-23 21:22 UTC подтверждает `Pending` и только `Preview`, public URL 404. Ждать moderation, не ресабмитить. |
| C | Playtesta | https://playtesta.com/ | Paid playtesting/listing | Для creator flow нужен аккаунт; JS bundle показывает checkout `PlayTesta - Indie Game Listing` за `$19`. | Не использовать без отдельного подтверждения бюджета. |
| B | CrazyGames | https://developer.crazygames.com/ | HTML5/WebGL portal | Basic Launch возможен после Basic Implementation/QA без монетизации; Full Launch требует CrazyGames SDK. Нужны английская локализация, PEGI 12, iframe readability/performance, no custom fullscreen, no cross-promotion, `<=50MB` initial download, `<=250MB` total, `<=1500` files. | Не quick PR. Делать только как отдельную портальную сборку: убрать внешние playable CTA/fullscreen, проверить iframe sizes/performance, затем preview/QA; Full Launch - отдельная SDK-задача. |
| Done | iDev.Games | https://idev.games/game/gigah-rush | HTML5 publish | Игра уже публична; дальнейшие действия только moderation/media polish. | Мониторить страницу, comments/plays и при необходимости позже доработать icon/promo через trusted UI. |
| Waiting | Kongregate | https://www.kongregate.com/en/developer/apply | HTML5/WebGL developer portal | Developer Application уже подана; нужен approval, затем Alpha/review. Common rejection reasons включают отсутствие screenshots, description, instructions, age rating, AI declaration и English option. | Ждать ответа Kongregate; после approval подготовить Alpha/upload материалы. |
| B | Game Jolt | https://gamejolt.com/games/gigahrush/1072064 | Game page + browser build/devlog | Public page is live and synced: package `1093814`, release `1474942`, build `1960153`, current ZIP `4 999 557` bytes; playable direct check passed. PR 14: полный media update live, короткий media post исправлен owner-comment с медиа и playable links. | Мониторить plays/comments/followers; сегодня больше не bump'ать Game Jolt. Позже добавить 3-5 gallery screenshots/GIFs через trusted UI path. |
| Sent | Armor Games | https://developers.armorgames.com/docs/introduction/overview/ | HTML5/iframe pitch по email | Принимают HTML5 и могут смотреть iframe; контакт `mygame@armorgames.com`. | Отправлено 2026-05-23 21:33 BST; ждать ответ, не слать быстрый follow-up. |
| Sent | TapCraftBox | https://tapcraftbox.com/page/submit-game | HTML5 email submission | Требования: HTML5, без disruptive ads/malicious links, права на распространение; контакт `support@tapcraftbox.com`. | Отправлено 2026-05-23 21:34 BST; ждать ответ/review request, не слать быстрый follow-up. |
| C | CWS Games | https://www.cwsgames.com/developers.html | Discord submission thread | Принимают browser games, но сайт adult-creator oriented; игра не NSFW. | Решение: пропустить пока, чтобы не ставить survival horror в adult-adjacent каталог. |
| Skip | EmilyGaming | https://www.emilygaming.com/ | HTML game upload | Kids-friendly positioning conflicts with survival horror/violence. | Не подавать текущий билд. |
| Watch | Share.games | https://share.games/ | Future HTML5 platform | Сейчас waitlist/early access. | Добавить в watchlist, не тратить время на submission. |
| C | MegaViral | https://www.megaviral.games/submit/ | Paid HTML5 listing | Требует account email/password и Stripe `$1/month per game`; также лучше PG/family-friendly формулировка. | Не использовать без подтверждения бюджета и контентной совместимости. |
| C | Poki | https://developers.poki.com/ | Curated portal | Жесткие требования к размеру, mobile/desktop, 16:9, no external links, target initial download under 8 MB. | Пока только как future porting target. |
| C | GamePix | https://partners.gamepix.com/developers | HTML5 partner portal | Нужна SDK-интеграция и approval. | Только если появится отдельная revenue-share портальная стратегия. |
| A | Яндекс Игры | https://yandex.com/support/games/ru/for-developers | HTML5 submission | Требуется SDK, модерация, технические требования, возрастная/контентная политика. | Отдельная интеграционная задача: SDK, сохранения, сборка, модерационный пакет. |
| A | Пикабу Игры | https://games.pikabu.ru/add-own-game | HTML5 submission | Нужны GamePush SDK, модерация, русскоязычный интерфейс; возможны требования к статусу разработчика. | Отдельная интеграционная задача после Яндекс/портального адаптера. |
| A | ИграйТут | https://igraytut.ru/pages/publishing-rules | HTML5/WebGL submission | Ручная модерация, ограничения по внешним скриптам/размеру/ссылкам. | Проверить build size и отправить через форму/контакт. |
| Done | MyIndie | https://myindie.ru/games/game/gigahrush | Страница игры | Опубликована публичная Web (HTML5) карточка с cover, screenshots, RU copy, links and current ZIP. | Мониторить страницу/Web iframe/comments; не делать duplicate listing. |
| B | IndieHub | https://indiehub.ru/ | Страница игры | Нужна регистрация; не нарушать правила каталога. | Добавить короткую страницу и ссылку на itch. |

## Волна 3: кураторы, медиа, стримеры

| Приоритет | Площадка | URL | Формат | Что отправлять |
| --- | --- | --- | --- | --- |
| A | Alpha Beta Gamer | https://www.alphabetagamer.com/contact-us/ | Game submission | Ссылка на playable build, краткий pitch, 3 screenshots/GIF, что игра in development/free to access. |
| A | Free Game Planet | https://www.freegameplanet.com/contact/ | Email/Twitter suggestion | Короткий pitch, direct browser link, GIF, акцент на free browser horror. |
| A | Indie Games Plus | https://indiegamesplus.com/contact/ | Email pitch | Sent 2026-05-23 21:35 BST; ждать ответ/coverage, быстрый follow-up не делать. |
| A | Games Pending | https://gamespending.itch.io/ | Creator pitch | Free itch link, browser/no install, suggested route/session length, content warning. |
| B | DreadXP | https://dreadxp.com/how-to-pitch-dreadxp/ | Horror pitch | Только если цель - publisher/coverage; нужен сильный horror hook и trailer/GIF. |
| B | Indie Horror Showcase / The MIX | https://www.indiehorrorshowcase.com/ | Event submission | Ждать open submissions; нужен trailer 30-60 sec, page, press kit. |
| B | PC Gamer tips/editors | https://www.pcgamer.com/about-pc-gamer/ | Email tip | Слать только после трейлера/крупного обновления: "browser survival horror in endless Soviet apartment block". |
| B | VK Play Media | https://support.vkplay.ru/vkp_media/faq/3767 | Письмо редакции | Sent 2026-05-24 00:28 BST; ждать ответ/coverage, быстрый дубль не слать. |
| B | Indie Spotlight | https://t.me/indiespotlight | Предложка/контакт | RU pitch, GIF, ссылка на itch, просьба о посте/подборке. |
| C | Rock Paper Shotgun | https://www.rockpapershotgun.com/ | Pitch/news tip | Только с новостным поводом: крупный релиз, трейлер, Steam page, festival. |
| C | Product Hunt | https://www.producthunt.com/launch/ | One-day launch | Нельзя просить upvotes; аудитория tech/product, не core horror. |
| C | Hacker News Show HN | https://news.ycombinator.com/show | Tech/dev post | Только с техническим углом: zero-dependency one-file WebGL/procedural build. |

## Угол подачи

Главный hook:

> Браузерный survival horror / ARPG shooter про вылазки в бесконечной хрущевке, где NPC живут и умирают, фракции делят зоны, а САМОСБОР может закрыть двери и изменить этаж.

Вторичные hooks:

- запускается прямо в браузере без установки;
- процедурные текстуры, спрайты, звук и WebGL/canvas raycaster;
- 1024x1024 тороидальный бетонный этаж;
- A-Life NPC, перманентные смерти и последствия;
- редкий русскоязычный survival horror по мотивам Самосбора;
- не "уровни", а вылазки: еда, вода, патроны, документы, слухи, контракты.

## Правила кампании

- Не постить один и тот же текст везде.
- Перед ответами на грубые комментарии использовать `Docs/PRCampaign/comment_response_playbook_ru_2026-05-24.md`: отвечать как представитель проекта, жестко только по тезису, без маскировки под случайного игрока, бампов, просьб о лайках/репортах и личных оскорблений. Снаружи не называть людей "хейтерами"; внутри классифицировать как фидбек, ложный факт, вопрос, троллинг или no-reply.
- Не маскировать разработчика под случайного игрока.
- Не накручивать голоса, лайки, комментарии и рейтинги.
- DTF-паттерн считать приоритетным для следующей волны: уникальный UGC/devlog, 1 GIF + 3-5 скриншотов, понятная playable-петля, прямые ссылки, developer disclosure и конкретный фидбек-запрос. Не копировать DTF-текст дословно.
- На Reddit сначала читать rules конкретного сабреддита; link-only post почти всегда плохой.
- Гибкое media-first правило: каждый публичный PR-пост, devlog, форумная тема, карточка портала или публичный анонс должен иметь видимое медиа-присутствие проекта: игровой скриншот, GIF, короткое видео, gallery image, platform thumbnail или native upload из текущего утвержденного медиапака. Основной источник медиа - `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/` и public itch media URLs.
- Правило ссылок: если площадка разрешает ссылки, добавлять рабочую playable-ссылку; по умолчанию использовать direct browser build `https://gigahrush.bileter.workers.dev` плюс itch.io mirror `https://tenevik.itch.io/gigahrush`, когда правила разрешают обе. Если ссылки запрещены или нежелательны, не обходить модерацию и не маскировать URL: делать сильный самостоятельный media-first рассказ о проекте без внешних ссылок. Если площадка требует direct-link-only submission или запрещает медиа в стартовом посте, playable URL может быть самим URL поста, а media добавлять в первый разрешенный комментарий, gallery/profile/media field или follow-up только если правила это разрешают.
- Планка качества поста: каждый публичный пост вести как отдельный мини-проект, а не слот для копипаста. Перед публикацией зафиксировать аудиторию, платформенный hook, нативный порядок медиа, разрешенный link/CTA plan, developer disclosure, 3-5 конкретных фактов геймплея, план ответов в комментариях и no-go условия. Пост не готов, если он generic link dump, без медиа, скрывает affiliation, повторяет чужой текст или игнорирует правила площадки.
- На DTF/GameDev.ru просить конкретный фидбек, а не "оцените вообще".
- На медиа писать один короткий pitch и один follow-up через 7-10 дней, если есть повод.
- Для медиа в следующей волне использовать `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/` как первичный набор: GIF-хуки, девять PNG и 3x3 contact sheet; старые `itch_page_pack` папки только как backup/cover/capsules.
- Для 2ch /b/ больше не публиковать новый OP: live thread уже есть на https://2ch.org/b/res/333348764.html. Только мониторить реальные ответы и отвечать по делу; Game Jolt/MyIndie/Telegram давать только по запросу, без автопостинга, бампов и просьб о голосах.
- Для порталов с SDK заводить отдельную интеграционную задачу, не ломать основной zero-runtime build.

## Следующие действия

1. Ждать ответа/эффекта по itch.io listing incident: публично на 2026-05-23 21:03 UTC страница все еще `noindex` и не видна в itch search. Dashboard checklist и `Metadata` / соседние разделы проверены: code/assets `No license`, release date `22/05/2026 00:00 BST`, publisher blank, browser/HTML5, false engine tools не выбраны, External links компактные, current ZIP ready/embedded. Support email отправлен из `jirnyak@gmail.com` в 20:22 UTC. Devlog editor тоже проверен: post published, но slug/permalink поля нет; public permalink теперь flagged-for-moderator-review/login-gated. Public itch iframe hash не совпадает с локальным `dist/`/ZIP, поэтому следующий recheck должен включать `noindex`, search, devlog gate и intended build hash; заголовок devlog ради латинского слага менять только после owner/support ok.
2. Проверить GamHub через 48-72 часа: поиск `GIGAH|RUSH`, наличие страницы, теги и ссылки; follow-up 2026-05-23 21:26 UTC публичного листинга еще не нашел, sitemap без `gigahrush`.
3. Newgrounds: не использовать в активных ссылках, пока `itch/gigahrush-itch.zip` не прикрепится как реальный `4.77 MiB` / `4 999 557` byte archive; текущий blocker - `9B` attachment через штатный upload flow.
4. DTF: media/link edit выполнен 2026-05-23 20:44 UTC и канал отмечен успешным; recheck 2026-05-24 17:43 UTC: `2060` views, `529` hits, `13` comments, `10` favorites, `7` reactions, `total=2619`. Мониторить комментарии и отвечать только на конкретный фидбек, без duplicate post/link bump. Следующую волну вести в сторону похожих UGC/devlog площадок: DevTribe, Пикабу gamedev, Indie Spotlight, Game Jolt devlog, IndieDB article, TIGSource/HTML5GameDevs как long-running devlog/showcase. Reddit после PR 13 относится к monitoring-only. MyIndie после PR 11 уже относится к мониторингу. GameDev.ru: не делать generic release bump; возможен только ответ, который признает loading/progress риск direct build и ведет к itch.io как primary link. Chrome DOM automation рабочий, но при ошибке 12 сначала активировать Chrome/проверить `Allow JavaScript from Apple Events`, затем повторить; blind coordinate clicks не использовать.
5. Проверить review/public URL для GamHub, Fake Portal и FreeZonePlay; DiscoverGG уже live на `https://discovergg.com/game/gigahrush`, iDev.Games live на `https://idev.games/game/gigah-rush`, MyIndie live на `https://myindie.ru/games/game/gigahrush`, IndieDB browser/account открывает страницу, но shell остается Cloudflare-challenged.
6. Querygame не считать submitted: public follow-up 2026-05-23 18:00 UTC все еще 404, submit API ранее вернул `405`.
7. Gamemoor support request уже отправлен; мониторить reply/bounce и при необходимости повторить через contact form. Free Indie Games все еще требует рабочий contact/repair формы.
8. Reddit PR 13: r/PBBG, r/WebGames и r/Games Indie Sunday мониторить; r/IndieDev не репостить; r/indiegames держать on hold unless owner/manual rewrite or modmail. Новые публичные посты только с native media plus allowed playable links или самостоятельным no-link описанием, если ссылки запрещены.
9. Email batch 1 отправлен: Alpha Beta Gamer, Free Game Planet, Games Pending. Email batch 2 отправлен: Armor Games, TapCraftBox, Indie Games Plus; Gamemoor support request тоже отправлен. Email batch 3 отправлен: VK Play Media, HorrorFam, Indie Game Buzz, Into Indie Games. Не отправлять быстрые follow-up; мониторить ответы/coverage/bounce.
10. PLRun не считать P0: старый `dev@plrun.com` bounce/misconfigured, developer URL `410`; возвращаться только после подтверждения актуального contact path.
11. Game Jolt уже public/playable и синхронизирован с текущим `4 999 557` byte ZIP; PR 14 исправил слабый короткий post одним visible owner media/playable comment и подтвердил full media update live. Дальше мониторинг, extra gallery media через trusted UI path и ответы на реальные комментарии; не делать еще один Game Jolt bump сегодня.
12. Kongregate developer application уже подана; ждать review/approval перед Alpha/upload. CrazyGames остается отдельной portal-build задачей. iDev.Games и MyIndie уже опубликованы и теперь относятся к мониторингу.
13. 2ch /b/: old thread `https://2ch.org/b/res/333348764.html` now archives to 404; не делать duplicate thread, автопостинг, пустые bumps или link-only mirrors.
14. Для грубых комментариев и Asder-style критики использовать `Docs/PRCampaign/comment_response_playbook_ru_2026-05-24.md`: один ответ по делу, сохранить полезный фидбек про управление/онбординг/экономику, прекратить спор при повторном bait.
15. Спланировать SDK-адаптер для Яндекс Игры / Пикабу Игры без загрязнения основной сборки.
16. Reddit/PBBG: `Docs/PRCampaign/reddit_pbbg_publicity_2026-05-24.md` теперь исторический prep source, уже использованный в `Docs/PRCampaign/PR_13.md`. Текущий статус: мониторинг live threads, PBBG.com pending review, no reposts.

## 2026-05-24 Reddit/PBBG publicity prep - superseded by PR 13

Срез 16:33 UTC / 17:33 BST: был подготовлен EN пакет. После owner override он был использован в PR 13; считать его историческим source, не очередью на публикацию. Подробный файл: `Docs/PRCampaign/reddit_pbbg_publicity_2026-05-24.md`.

| Поверхность | Свежий факт | Решение |
| --- | --- | --- |
| r/PBBG | Published in PR 13. | Monitor; answer single-player/local-persistence questions, no repost. |
| r/WebGames | Published in PR 13 as direct-link post. | Monitor browser/readability feedback, no repost. |
| r/indiegames | Not posted. Risk is media-first/external-link/AI ambiguity, not missing playable links. | Hold unless owner manual rewrite or modmail. |
| PBBG.com | Submitted for review in PR 13; final accepted image was `11_factions_alife_rank_panel.png`. | Recheck public listing URL later; do not duplicate-submit. |

## 2026-05-24 PR 13: Reddit/PBBG publication push

Срез 16:50-16:57 UTC / 17:50-17:57 BST: по owner override "публикуй везде" сделана широкая EN-публикация через существующую Chrome/old.reddit сессию и public PBBG.com form. Подробный журнал: `Docs/PRCampaign/PR_13.md`.

| Поверхность | Свежий факт | Решение |
| --- | --- | --- |
| r/PBBG | Published: https://old.reddit.com/r/PBBG/comments/1tmhjtz/gigahrush_a_singleplayer_persistent_browser/. Initial authenticated JSON: `removed_by_category:null`, `over_18:false`, score `1`, comments `0`, flair `Game Advertisement`. | Мониторить; отвечать на PBBG-fit вопросы честно: single-player/local persistence, not MMO/PvP. |
| r/WebGames | Published: https://old.reddit.com/r/WebGames/comments/1tmhk3l/gigahrush_free_browser_survival_horror_arpg_in_an/. Direct-link post to online build; developer comment added. Initial authenticated JSON: `removed_by_category:null`, `over_18:false`, score `1`, comments `1`. | Мониторить browser performance/readability feedback and moderation state. |
| r/Games Indie Sunday | Published: https://old.reddit.com/r/Games/comments/1tmhl9l/gigahrush_tenevik_games_browser_survival_horror/. Flair `Indie Sunday`; comment added. Initial authenticated JSON: `removed_by_category:null`, `over_18:false`, score `1`, comments `1`. | High-risk large subreddit; monitor closely, no repost if removed. |
| r/IndieDev | Posted then removed: https://old.reddit.com/r/IndieDev/comments/1tmhkq5/gigahrush_a_typescriptwebgl_survival_horror_where/. Initial authenticated JSON showed `removed_by_category:moderator`. | Считать снятым; не репостить немедленно. |
| PBBG.com | Submitted for review. Final response: `Thank you for your submission! It will be reviewed for approval.` | Pending listing; recheck public URL later, do not duplicate-submit. |
| r/indiegames | Not posted. | Current rules risk around native media, links, feedback-bait and AI-related content remains; only owner manual rewrite/modmail. |

Correction 17:06 UTC / 18:06 BST: r/PBBG received a media comment with both playable links and direct itch GIF/screenshot URLs; existing r/WebGames and r/Games comments were edited to include both playable links and direct itch GIF/screenshot URLs. This is now the required pattern for direct-link-only Reddit posts: playable URL as submission plus media links in the first allowed comment.

## 2026-05-23 PR 11: public upload/application pass

Срез 21:23-21:45 UTC / 22:23-22:45 BST: owner instruction was to make/upload public. MyIndie published, iDev.Games rechecked, Kongregate application submitted, Newgrounds blocker rechecked. Подробный журнал: `Docs/PRCampaign/PR_11.md`.

| Поверхность | Свежий факт | Решение |
| --- | --- | --- |
| MyIndie | Создана и опубликована карточка `ГИГАХРУЩ`: https://myindie.ru/games/game/gigahrush. Загружены cover, 3 screenshots and current `itch/gigahrush-itch.zip` (`4 999 557` bytes). Public page shows `WEB VERSION`, `Версия 0.2.0`, Web (HTML5), engine `Another`, RU/EN and date `23.05.2026`; Web iframe points to uploaded ZIP `.../web/gigahrush_1779572489186.zip/index.html`. | Считать активной публичной ссылкой; мониторить iframe, moderation and comments. |
| iDev.Games | Public page still live: `Gigah Rush - Free Online Browser Game`, `4 plays`, `10.26 MB`, edit page says released and visible to everyone. | Monitoring/media-polish only; no resubmit. |
| Kongregate | Developer Application submitted. Confirmation says it is Step 1 and Kongregate will review/respond. | No public listing yet; wait for approval before Alpha/upload materials. |
| Newgrounds | Chrome is at login; durable state remains RIP/eulogy plus `9B` ZIP upload blocker in project `7759223`. | Keep out of active links and do not publish until preview accepts a real archive. |

## 2026-05-23 PR 10: публичный monitoring pass

Срез 20:59-21:26 UTC / 21:59-22:26 BST: публичные проверки плюс browser/account state там, где сессия уже была открыта. Сделана одна корректирующая правка Fandom EN; без duplicate submissions, ответов, голосов и blind final-click действий. Подробный журнал: `Docs/PRCampaign/PR_10.md`.

| Поверхность | Свежий факт | Решение |
| --- | --- | --- |
| itch.io page | `200 OK`, playable/direct URL живой, но `noindex` остается. Страница теперь показывает `Updated: 23 May 2026 @ 20:04 UTC`, iframe `html/17651708/index.html?v=1779563799`, 14 screenshots/GIFs и внешние ссылки на homepage/Telegram/direct/IndieDB/Game Jolt. Public itch iframe `index.html` не совпадает с локальным `dist`/ZIP по размеру и SHA-256. | Ждать support/indexing; не пересоздавать страницу и не дублировать itch posts. Перед claim'ами о parity itch/Cloudflare проверить, какой upload на itch должен быть актуальным. |
| itch.io search | `gigahrush`, `GIGAH|RUSH`, `ГИГАХРУЩ` по-прежнему не выводят Tenevik page. | Повторить после ответа поддержки или более длинной задержки индексации. |
| itch.io devlog permalink | `/devlog/1530909/-` возвращает публичный `404`, но теперь текст страницы явно говорит: flagged for moderator review, access restricted to logged-in users. | Не шарить прямой permalink; безопасные ссылки только game page/devlog index. |
| Cloudflare build | `200 OK`, `10 673 018` bytes, SHA-256 `732ced4bc2d7bcf91edaec7382ca67d5f4707d1e75ed3c5a29f0ed5df3424d18`, title `ГИГАХРУЩ - САМОСБОР`, `noindex` нет. | Оставить активной прямой browser-ссылкой. |
| DTF / Reddit / GameDev.ru | DTF marked successful; published/not removed at 21:44 UTC: `1999` views, `472` hits, `12` comments, `10` favorites, `6` reactions, `total=2499`, public page roughly `2.4K` views. Reddit r/playmygame live/non-NSFW: earlier same-pass JSON clean with score `1`, only AutoModerator; later unauthenticated shell fetch was blocked. GameDev.ru без новых ответов после complaint/reply. | Только мониторинг и ответы на конкретный фидбек; новых bump/post не делать. Использовать DTF-паттерн на новых площадках с уникальным текстом и медиа. |
| Review portals | DiscoverGG and iDev.Games live/indexable enough for campaign links. IndieDB opens in Chrome browser/account with game and screenshot page titles, but shell still Cloudflare `403`. GamHub/Fake Portal/FreeZonePlay все еще не видны публично; Fake Portal dashboard says `Pending`. Querygame все еще 404/not submitted. Newgrounds shell = `403`, прежний RIP/`9B` blocker не снят. | Ждать review windows для GamHub/FakePortal/FreeZonePlay, browser/account для IndieDB/Newgrounds, Querygame не считать submitted. |

## 2026-05-23 Участок 4: quick RU/listing public recheck

Проверено без логина и без отправок: MyIndie, IndieHub, iDev.Games, Gamemoor.

| Площадка | Статус после публичной проверки | Следующий безопасный шаг |
| --- | --- | --- |
| MyIndie | Superseded PR 11: public playable listing is live at https://myindie.ru/games/game/gigahrush. | Больше не quick target; мониторить page/Web iframe/comments и не делать duplicate listing. |
| IndieHub | Public add path broken: `/game/add` отвечает, что страница не существует и нужно обратиться к администрации в Telegram. | Не считать готовым quick target; сначала support Telegram или logged-in dashboard check. |
| iDev.Games | Уже опубликован: https://idev.games/game/gigah-rush, edit page сообщает `Public: This game has been released and is visible to everyone!`. | Больше не quick target, а monitoring/media-polish surface. |
| Gamemoor | Contact page говорит, что developer portal открыт и review занимает несколько дней; public `/developer` ведет на login, guessed submit/dashboard paths не работают. | После логина проверить `/developer`; при блоке отправить support message для account `jirnyak`. |

Итог после PR 11: MyIndie и iDev.Games уже public; Gamemoor access/support остается review-queue; Kongregate application уже подана и ждет approval; CrazyGames только отдельная portal-build задача; IndieHub только после support/account path.

## 2026-05-23 Expanded account-gated portal recheck

Публичная проверка 20:31 UTC / 21:31 BST, без логина, без отправок и без final-click: MyIndie, iDev.Games, IndieHub, Kongregate, CrazyGames, Gamemoor.

| Площадка | Классификация | Что нужно от владельца |
| --- | --- | --- |
| MyIndie | Completed/public after PR 11: https://myindie.ru/games/game/gigahrush. Каталог поддерживает `Web (HTML5)`, `Horror`, `Shooter`, `RPG`, `Survival`, движок `Another`; карточка уже опубликована с текущим ZIP. | Мониторить страницу, Web iframe, comments/moderation and link retention. |
| iDev.Games | Public listing уже есть: https://idev.games/game/gigah-rush; browser/edit check подтверждает `Public` и visible to everyone. | Мониторить moderation/plays/comments и позже улучшить icon/promo media при необходимости. |
| IndieHub | Support-blocked. Homepage показывает `добавить игру`, login/register, rules и Telegram support, но public `/game/add` сейчас возвращает ошибку “страница не существует” и просит обратиться к администрации. Rules требуют publisher rights и запрещают spam/malware/illegal/misleading/infringing content. | Проверить после login, появляется ли hidden add-flow, или написать в support Telegram за актуальным URL. Не делать final-click, пока нет рабочей формы и понятного draft/public state. |
| Kongregate | Developer Application submitted after PR 11. Still not quick: нужен approval, legal upload agreement, Alpha/review; нужны browser playability, screenshots, description, instructions, age rating, AI declaration, English option; publish только после review. | Ждать Kongregate response/approval. После approval подготовить Alpha materials. |
| CrazyGames | SDK/portal-build track. Basic Launch может идти без CrazyGames-specific integration и без monetization, но через Basic QA; Full Launch требует Full Implementation + SDK. Требования: `<=50MB` initial download, `<=250MB` total, `<=1500` files, relative paths, Chrome/Edge, readable iframe/mobile UI, English localization, PEGI 12, no custom fullscreen, no cross-promotion. | Принимать как отдельную technical задачу: owner login в Developer Portal после согласия на portal build; затем убрать external playable CTA/fullscreen, проверить English path, iframe/performance, и только потом preview/QA. Full Launch - отдельная SDK-интеграция. |
| Gamemoor | Review queue после portal access, но доступ может быть support-blocked. Contact page говорит, что developer portal открыт и review обычно несколько дней; `/developer` редиректит на login; public `/submit`, `/dashboard`, `/my-games` = 404, `/games/add` -> 404. Terms: PEGI 3-16, no NSFW. | Войти и открыть `/developer`; если снова нет доступа, отправить support request для account `jirnyak` с просьбой включить developer portal или дать submit URL. Подавать как non-NSFW survival horror / PEGI 16. |

Очередность после PR 11: MyIndie и iDev.Games мониторить как public surfaces; Gamemoor support/access остается; Kongregate ждать approval; CrazyGames только как отдельная portal-build/SDK задача; IndieHub только после support/account path.
