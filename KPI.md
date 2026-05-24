# GIGAH|RUSH KPI Agent

Role: track public media presence for GIGAH|RUSH across published pages, community posts, portals, wikis, search/indexing surfaces and campaign backlog. This file is an operating brief for a future agent. It does not grant permission to spam, manipulate votes, hide developer affiliation or bypass platform moderation.

Current date baseline: 2026-05-24.

Latest detailed public monitoring/upload pass: `Docs/PRCampaign/PR_14.md` at 2026-05-24 17:32-17:44 UTC / 18:32-18:44 BST.

Latest owner-requested community publication: Reddit/PBBG push on 2026-05-24. Live posts: r/PBBG `https://old.reddit.com/r/PBBG/comments/1tmhjtz/gigahrush_a_singleplayer_persistent_browser/`, r/WebGames `https://old.reddit.com/r/WebGames/comments/1tmhk3l/gigahrush_free_browser_survival_horror_arpg_in_an/`, r/Games Indie Sunday `https://old.reddit.com/r/Games/comments/1tmhl9l/gigahrush_tenevik_games_browser_survival_horror/`. At 17:06 UTC the live Reddit comments were corrected to include both playable links and direct GIF/screenshot URLs. PBBG.com directory was submitted for review. r/IndieDev post was already removed by moderator/automoderation; do not repost immediately.

Latest continuation/fix pass: PR 14 fixed the weaker Game Jolt media post by adding one visible developer media/playable comment, confirmed the full Game Jolt media update is live, confirmed the IndieDB news article is submitted and awaiting authorisation, attempted HTML5GameDevs Game Showcase but stopped at required registration/password/Terms details, and logged DevTribe/Pikabu account blockers. No existing playable links were removed.

Current PR media source: `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/`. Future agents should take screenshots/GIFs/contact-sheet material from that folder first. The square overview is `contact_sheet_3x3.png`; `contact_sheet_png.png` is the same 1 920 x 1 920 sheet under the older filename.

Current Reddit/PBBG publicity pack: `Docs/PRCampaign/reddit_pbbg_publicity_2026-05-24.md`. It is the prep source already used by `Docs/PRCampaign/PR_13.md`, not an unposted draft. PR 13 published r/PBBG, r/WebGames and r/Games Indie Sunday, submitted PBBG.com for review, recorded r/IndieDev removal, and corrected live Reddit comments with playable links plus direct media URLs.

Current comment-response playbook: `Docs/PRCampaign/comment_response_playbook_ru_2026-05-24.md`. Use it before answering harsh comments on 2ch, DTF, GameDev.ru, Reddit or portal pages. It contains the agent input/output format, guardrails for hard-but-factual replies, and prepared RU answers for the current Asder-style criticism cluster. Public replies should not call people "haters"; classify them internally as concrete feedback, false facts, questions, trolling or no-reply.

## Operating Rules

- Report facts first: availability, indexing, visible links, comments, moderation state, traffic signals and concrete next actions.
- Do not post, repost, bump, vote, rate, ask for votes, mass-comment or contact media unless the owner explicitly asks for that action.
- Do not ask for passwords in chat. If access is needed, ask the owner to log in through Opera GX or Chrome and say `готово`; request only one-time codes if a site asks for them.
- Keep developer affiliation clear in every recommendation.
- Flexible media-first rule: every public campaign post, devlog, forum thread, portal listing or public announcement must have visible project media: a gameplay screenshot, GIF, short video, gallery image, platform thumbnail or native upload from the current approved media pack. Use `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/` and public itch media URLs as the default sources.
- Link handling rule: when platform rules allow links, include a currently playable link and prefer the direct browser build `https://gigahrush.bileter.workers.dev` plus the itch.io mirror `https://tenevik.itch.io/gigahrush`. When links are forbidden or discouraged, do not evade moderation, disguise URLs or dump links in comments; publish a strong self-contained media post about the game instead. When a platform requires direct-link-only submission or forbids media in the initial post, use the playable URL as the submission and put media in the first allowed comment, gallery/profile/media field or follow-up only if rules allow it.
- Per-post quality bar: treat every public post as its own mini-project, not a copy-paste. Before publishing, define the target audience, one platform-specific hook, native media order, allowed link/CTA plan, developer disclosure, 3-5 concrete gameplay facts, comment-response plan and exact no-go conditions. A post fails the bar if it is a generic link dump, lacks media, hides affiliation, repeats another post verbatim or ignores platform rules.
- Treat horror as survival horror, not NSFW, unless a platform questionnaire itself requires a stricter content label.
- When a platform blocks automation with Cloudflare, captcha, account validation or moderation review, record the blocker exactly and switch to manual-owner instructions.
- If Chrome browser automation is needed, require `View > Developer > Allow JavaScript from Apple Events`; do not use blind coordinate clicks for final Send/Publish/File Upload actions.

## Core Links

| Surface | URL | Status | What To Watch |
| --- | --- | --- | --- |
| itch.io game page | https://tenevik.itch.io/gigahrush | Live and playable by direct URL/profile, but still not indexed. Public recheck on 2026-05-23 21:03 UTC: page `200 OK`, title `GIGAH\|RUSH by Tenevik Games`, profile lists the game, playable embed present, page shows `Updated: 23 May 2026 @ 20:04 UTC`, HTML still has `noindex`; itch search for `gigahrush`, `GIGAH\|RUSH` and `ГИГАХРУЩ` still does not show the Tenevik page. Dashboard source check found `published:true`, `restricted:false`, `unlisted:false`, current HTML ZIP ready/embedded, cover/screenshots present, Metadata saved; support email sent to `support@itch.io` from `jirnyak@gmail.com` at 20:22 UTC. Devlog editor confirms the post is published but exposes no slug/permalink field; public permalink `/devlog/1530909/-` still returns `404` and now says the page is flagged for moderator review / login-gated. Public iframe hash at 21:02 UTC differs from local `dist/`/ZIP (`6bc3eff...` vs `732ced4...`). | Wait for itch support/indexing review, recheck `noindex`, exact search, devlog access and iframe hash after a real delay or support reply; do not change the public devlog title just to force a Latin slug unless owner/support approves. |
| Direct Cloudflare build | https://gigahrush.bileter.workers.dev | Live. Public recheck on 2026-05-23 21:03 UTC: `200 OK`, title `ГИГАХРУЩ - САМОСБОР`, no public `noindex`, response size `10 673 018` bytes and SHA-256 `732ced4bc2d7bcf91edaec7382ca67d5f4707d1e75ed3c5a29f0ed5df3424d18` matched local `dist/index.html`. | Availability, title, boot health, console/runtime errors, and whether the intended release should be re-synced to itch because the current public itch iframe hash differs. |
| 2ch /b/ | https://2ch.org/b/res/333348764.html | No longer publicly reachable at the original URL. Public recheck on 2026-05-24 17:43 UTC redirected to `https://2ch.org/b/arch/2026-05-24/res/333348764.html` and returned `404`; earlier live snapshot was 2026-05-23 23:26 UTC with 14 posts, 11 files, 6 posters and OP media. | Log as archived/404. Do not recreate a duplicate thread or bump. Only use a new 2ch action if the owner explicitly asks for a fresh surface with a new media-first plan. |
| Telegram | https://t.me/gigah_rush | Public campaign/contact link. | Subscriber count, posts, comments/reactions if visible, whether this remains valid contact. |
| Newgrounds | https://www.newgrounds.com/portal/view/1033564 | Removed / RIP. On 2026-05-23 the view URL redirects to `https://www.newgrounds.com/portal/rip/1033564`; page title is `Eulogy for: GIGAH RUSH` and dates show `May 22, 2026 - May 22, 2026`. Existing project `7759223` is editable, but both the normal browser upload flow and direct `/parkfile` attach save the HTML5 ZIP as `9B`; the bad attachment was deleted and no playable ZIP is attached. | Manual/support blocker: do not publish until Newgrounds accepts a real `4.77 MiB` / `4 999 557` byte archive in preview. |
| DTF | https://dtf.ru/indie/5077801-gigahrush-brauzernyj-survival-horror | Successful RU devlog/community post. Edited on 2026-05-23 20:44 UTC / 21:44 BST after comment feedback: added a 5-item media gallery (blinking-eyes GIF plus 4 screenshots) and converted itch.io, Telegram and direct-build URLs into clickable DTF redirect links. Public recheck on 2026-05-24 17:43 UTC: still published/not removed, `2060` views, `529` hits, `13` comments, `10` favorites, `7` reactions, `total=2619`. Treat this as the current proof that DTF-like UGC/devlog surfaces can grow community. | Monitor comments and answer concrete follow-up feedback only; do not create a duplicate post or link-only bump. Use the winning pattern for new surfaces: media-rich devlog, clear playable loop, direct links, developer disclosure and a concrete feedback ask. |
| GameDev.ru | https://gamedev.ru/projects/forum/?id=295485 | Published forum topic. Public recheck on 2026-05-23 20:59 UTC: `200 OK`; still shows concrete report `#1` that the direct online build looked stuck on a dark-blue screen and asks for a progress bar, with owner reply `#2` about Cloudflare/VPN. | Reply/update is only conditional: acknowledge the loading/progress issue and prefer itch.io as the primary playable link; do not bump with a generic release ad. |
| itch.io Release Announcements | https://itch.io/t/6385827/gigahrush-free-browser-survival-horror-in-an-endless-concrete-apartment-block | Published and fixed. Public recheck on 2026-05-23 21:06 UTC: `200 OK`, 38 views, one post, embedded GIF and itch/direct links visible. | No reply needed now unless a real comment/question appears. |
| itch.io Devlog | https://tenevik.itch.io/gigahrush/devlog | Devlog index is live and lists the May 22 launch post; public recheck on 2026-05-23 shows the direct URL `https://tenevik.itch.io/gigahrush/devlog/1530909/-`, but fetching that URL returns `404`. Devlog editor was checked: post is published, no slug/permalink field is exposed. | Keep the devlog index as the safe link; wait for itch support or owner-approved title/slug change. |
| GamHub | https://gamhub.net/website_submit/ | Submitted 2026-05-22 through public form; API returned `{"code":200,"msg":"Submit success"}`. Public follow-up on 2026-05-23 21:26 UTC: `/game/gigahrush/` and `/game/gigah-rush/` still returned `404`; sitemap contained no `gigahrush`; no contact/about page was found, only the submit form. | Check search/listing after 48-72h, final game URL, tags, whether itch/direct/Telegram links survive review. Do not duplicate-submit same-day. |
| Samosbor Archive Fandom RU | https://samosborarchive.fandom.com/ru/wiki/ГИГАХРУЩ | Published game page. | Page availability, edits/reverts, external link retention, categories. |
| samosb0r Fandom RU | https://samosb0r.fandom.com/ru/wiki/ГИГАХРУЩ | Published game page. | Page availability, edits/reverts, external link retention, categories. |
| Self-Assembly Wiki EN / Fandom | https://samosborarchive-en.fandom.com/wiki/GIGAH_RUSH | Published game page. Authenticated API edit on 2026-05-23 21:19 UTC replaced the inactive Newgrounds link with the live Game Jolt page; rev `420`, comment `Replace inactive Newgrounds link with live Game Jolt page`. API recheck retained itch/direct/Telegram/DTF/GameDev/Game Jolt links and no Newgrounds extlink. | Page availability, edits/reverts, external link retention, EN terminology. |
| Reddit r/playmygame | https://www.reddit.com/r/playmygame/comments/1tku91k/gigahrush/ | Current non-NSFW post is live. Public JSON recheck on 2026-05-23 20:59 UTC: `removed_by_category:null`, `over_18:false`, score `1`, upvote ratio `1.0`, one visible AutoModerator comment, flair `[Mobile] (Web)`. | Watch comments only; do not repost identical copy across Reddit. |
| Reddit r/PBBG | https://old.reddit.com/r/PBBG/comments/1tmhjtz/gigahrush_a_singleplayer_persistent_browser/ | Published 2026-05-24 16:54 UTC through existing Reddit session as `Game Advertisement`. Authenticated JSON check at 16:57 UTC: `removed_by_category:null`, `over_18:false`, score `1`, comments `0`. Correction at 17:06 UTC added playable links plus direct GIF/screenshot URLs as a media comment. | Monitor comments/removal; answer PBBG-fit questions clearly: single-player/local persistence, not MMO/PvP. |
| Reddit r/WebGames | https://old.reddit.com/r/WebGames/comments/1tmhk3l/gigahrush_free_browser_survival_horror_arpg_in_an/ | Published 2026-05-24 16:54 UTC as direct link to `https://gigahrush.bileter.workers.dev`; developer comment added. Authenticated JSON check at 16:57 UTC: `removed_by_category:null`, `over_18:false`, score `1`, comments `1`. Correction at 17:06 UTC edited the existing developer comment to include both playable links plus direct GIF/screenshot URLs. | Monitor browser-performance/readability feedback and AutoModerator/moderation state. |
| Reddit r/Games Indie Sunday | https://old.reddit.com/r/Games/comments/1tmhl9l/gigahrush_tenevik_games_browser_survival_horror/ | Published 2026-05-24 16:56 UTC with `Indie Sunday` flair, gameplay GIF, itch and direct build links; expectation-setting comment added. Authenticated JSON check at 16:57 UTC: `removed_by_category:null`, `over_18:false`, score `1`, comments `1`. Correction at 17:06 UTC edited the existing comment to add both playable links plus direct GIF/screenshot URLs. | High-risk/large subreddit: monitor removal and comments closely; do not repost if removed. |
| Reddit r/IndieDev | https://old.reddit.com/r/IndieDev/comments/1tmhkq5/gigahrush_a_typescriptwebgl_survival_horror_where/ | Posted 2026-05-24, then authenticated JSON check at 16:57 UTC showed `removed_by_category:moderator`, `over_18:false`, score `1`, comments `1`. | Treat as removed. Do not repost immediately; only use modmail/manual review if owner wants. |
| PBBG.com directory | https://pbbg.com/games/create | Submitted for review 2026-05-24. Public recheck on 2026-05-24 17:43 UTC: `https://pbbg.com/games` publicly lists the May 24 r/PBBG post title and Reddit URL, but `https://pbbg.com/games/gigahrush` still returns `404`. The actual directory game listing is still pending. | Recheck for a real public game listing URL. Do not resubmit while pending. Note that PBBG.com front page already amplifies the r/PBBG post. |
| IndieDB | https://www.indiedb.com/games/gigahrush | Listing created 2026-05-23; profile assets and 5 gameplay screenshots uploaded. PR 14 browser/account check opened the news article `https://www.indiedb.com/games/gigahrush/news/gigahrush-clearer-media-for-the-browser-survival-horror-build`; IndieDB says it is `currently awaiting authorisation`, generally one day. Shell still hits Cloudflare `403`. | Browser/account recheck article authorisation/public comments/watchers after one day. Do not duplicate-submit the same news article. |
| DiscoverGG | https://discovergg.com/game/gigahrush | Live. Submitted 2026-05-23; public recheck on 2026-05-23 21:03 UTC returned `200 OK`, title `GIGAH\|RUSH — Free Browser Game`, `robots: index, follow`, one vote, and a play link to itch.io. The home page also includes `/game/gigahrush`; `/game/gigah-rush` remains non-canonical/404. | Monitor listing availability and whether itch/direct/Telegram links survive review edits. |
| Gamemoor | https://gamemoor.com/contact | Logged-in account exists, but `/developer` redirects to homepage and likely requires site-owner action. Gmail support request sent to `contact@gamemoor.com` on 2026-05-23 at 21:35 BST; public contact page itself does not expose an email address, so watch for bounce/response and use the form if needed. | Wait for reply/bounce; if no response, submit the same request through the contact form or retry after login. |
| Fake Portal | https://fakeportal.com/submit-a-game/ | Submitted 2026-05-23 through logged-in form; response: `Game submitted for review!`, `game_id: 10841`, status `pending`, title `GIGAH\|RUSH`. Logged-in dashboard check on 2026-05-23 21:22 UTC shows `Submitted Games (1)`, `GIGAH\|RUSH`, status `Pending`, date `May 23, 2026`, and only a `Preview` action; public `/games/gigahrush/` remains `404`. | Wait for moderation/public URL. Do not resubmit or contact-review-spam while dashboard says pending. |
| FreeZonePlay | https://freezoneplay.com/contact-us/ | Submitted 2026-05-23 through Contact Form 7; response `mail_sent`. WP admin post creation is `403`. Public follow-up on 2026-05-23 21:26 UTC: `/gigahrush/` and `/gigah-rush/` returned `404`; submit/add-game guessed paths returned `404`; WP REST exposes no custom game post type; only contact form is public. | Watch email/contact response or public listing; do not send same-day duplicate contact unless there is a support reply/bounce. |
| Querygame | https://querygame.com/submit | Blocked/submission not counted: earlier public form path exposed `/api/submit-game`, but direct POST returned `405`. Public follow-up on 2026-05-23 20:59 UTC: `/games/gigahrush` still returned Querygame `404 - Page Not Found`. | Recheck only if a working browser/account path is available; do not count as submitted. |
| Free Indie Games | https://www.freeindiegames.org/submit-game/ | Blocked by site bug: public page still displays raw shortcode `[ninja_forms_display_form id=1]` on 2026-05-23 18:00 UTC; earlier Ninja Forms REST route returned `404 rest_no_route`. | Owner/site maintainer must repair form or provide contact email. |
| iDev.Games | https://idev.games/game/gigah-rush | Public listing is live. Public fetch on 2026-05-23 21:21 UTC returned `200 OK`, title `Gigah Rush - Free Online Browser Game`, no `noindex`, SEO description/tags, profile `jirnyak`, and embed `/embed/gigah-rush`; logged-in edit page says `Public: This game has been released and is visible to everyone!`. The embed points to `/appvert/game/4008/game66400/`, which returns the game HTML with title `ГИГАХРУЩ - САМОСБОР`, canvas content and `10 673 937` bytes. | Monitor moderation/approval, comments/plays and whether icon/promo images need polish; no account action is needed for basic public status. |
| MyIndie | https://myindie.ru/games/game/gigahrush | Live public playable listing. Published 2026-05-23 after owner asked to make/upload public. Page shows `WEB VERSION`, `ГИГАХРУЩ`, version `0.2.0`, Web (HTML5), engine `Another`, RU/EN, genres Shooter/RPG/Action/Survival/Horror and date `23.05.2026`. Uploaded `itch/gigahrush-itch.zip` at `4 999 557` bytes plus cover and 3 screenshots; Web iframe opens the uploaded ZIP build. | Monitor moderation, plays/comments, download/Web iframe availability and whether links to itch/direct/Telegram remain visible. |
| Kongregate | https://www.kongregate.com/en/developer/apply | Developer Application submitted 2026-05-23; browser confirmation says the application is Step 1 and Kongregate will review/respond. No public game page exists yet. | Wait for developer approval before any Alpha/upload work; prepare screenshots, description, instructions, age rating, AI declaration and English option only after approval. |
| Game Jolt | https://gamejolt.com/games/gigahrush/1072064 | Public Game Jolt page published on 2026-05-23 18:50 UTC / 19:50 BST and package-synced on 2026-05-23 20:17 UTC / 21:17 BST. PR 14 browser check found two public posts: full media update `https://gamejolt.com/p/media-update-after-first-feedback-samosbor-gifs-screenshots-expe-ff7fm7k8`, and short post `https://gamejolt.com/p/media-update-after-first-community-feedback-preparation-trade-and-mbgfde7a`. The short post was corrected on 2026-05-24 17:42 UTC with one visible owner comment containing itch/direct/Game Jolt links, GIF/contact-sheet media URLs and concrete gameplay facts; browser showed `1 comment`. | Monitor comments/views only; no more Game Jolt bump comments today. Future improvement is gallery media upload, not another status post. |
| Alpha Beta Gamer | https://www.alphabetagamer.com/contact-us/ | Email pitch sent to `Admin@alphabetagamer.com` on 2026-05-23; Gmail showed `Message sent`. | Watch for reply/coverage; do not send immediate follow-up. |
| Free Game Planet | https://www.freegameplanet.com/contact/ | Email pitch sent to `admin@freegameplanet.com` on 2026-05-23; Gmail showed `Message sent`. | Watch for reply/coverage; do not send immediate follow-up. |
| Games Pending | https://gamespending.itch.io/ | Email pitch sent to `gamespending@gmail.com` on 2026-05-23 with a suggested 10-15 minute first-look route; Gmail showed `Message sent`. | Watch for reply/video; do not send immediate follow-up. |
| Armor Games | https://developers.armorgames.com/docs/introduction/overview/ | Email pitch sent to `mygame@armorgames.com` on 2026-05-23 at 21:33 BST; Gmail showed `Message sent`. | Watch for reply/coverage; do not send immediate follow-up. |
| TapCraftBox | https://tapcraftbox.com/page/submit-game | Email submission sent to `support@tapcraftbox.com` on 2026-05-23 at 21:34 BST; Gmail showed `Message sent`. | Watch for reply/review request; do not send immediate follow-up. |
| Indie Games Plus | https://indiegamesplus.com/contact/ | Tailored media pitch sent to `editors@indiegamesplus.com` on 2026-05-23 at 21:35 BST; Gmail showed `Message sent`. Sent Mail also shows an earlier generic editor pitch around 18:00, so do not follow up quickly. | Watch for reply/coverage; avoid another pitch unless there is a substantial new release/trailer. |
| VK Play Media | https://support.vkplay.ru/vkp_media/faq/3767 | RU editorial pitch sent to `mediavkplay@vkteam.ru` on 2026-05-24 at 00:28 BST / 2026-05-23 23:28 UTC; Gmail search confirmed the sent conversation. | Watch for reply/coverage; do not send a duplicate VK/editorial pitch quickly. |
| HorrorFam Indie Horror Inbox | https://horrorfam.com/contact/ | EN horror-roundup pitch sent to `lauren@horrorfam.com` on 2026-05-24 at 00:29 BST / 2026-05-23 23:29 UTC; Gmail search confirmed the sent conversation. | Watch for reply; HorrorFam asks to wait at least 7 business days before follow-up. |
| Indie Game Buzz | https://indiegamebuzz.com/contact/ | EN game-submission pitch sent to `games@indiegamebuzz.com` with subject `Game Submission: GIGAH\|RUSH` on 2026-05-24 at 00:30 BST / 2026-05-23 23:30 UTC; Gmail search confirmed the sent conversation. | Watch for reply/coverage; do not buy paid promo without owner approval. |
| Into Indie Games | https://intoindiegames.com/contact/ | EN feature/review pitch sent to `info@intoindiegames.com` on 2026-05-24 at 00:31 BST / 2026-05-23 23:31 UTC; Gmail search confirmed the sent conversation. | Watch for reply/coverage; no quick follow-up. |
| ShoutWiki | https://samosbor.shoutwiki.com/wiki/ГИГАХРУЩ | Blocked by abuse filter `запрет правок`, rule `1==1`. | Only revisit if the wiki owner unfreezes editing. |

## Primary KPIs

Availability:

- Game page returns 200 and has the expected title.
- Direct build returns 200 and is playable.
- External links are still visible on each published surface.
- No moderation removal, hidden state, broken embed or deleted page.

Discovery:

- itch.io `noindex` removed.
- Search result appears for `GIGAH RUSH`, `GIGAH|RUSH`, `ГИГАХРУЩ`, `ГИГАХРУЩ Самосбор`.
- Wiki pages remain indexed and not marked for deletion.
- Portal pages expose tags/genres correctly: survival horror, browser, HTML5/WebGL, ARPG/shooter, singleplayer.

Engagement:

- Comments, replies, reviews, ratings, plays, downloads, views, bookmarks, reactions, subscribers.
- Ratio of constructive comments to generic negative/low-effort comments.
- Recurring feedback themes: onboarding confusion, UI readability, browser performance, expedition pacing, Samosbor danger, combat clarity, localization.

Conversion:

- Users click from media/wiki/forum pages to itch.io, direct build or Telegram where metrics are available.
- Newgrounds/itch plays after posts.
- Telegram joins after new publications.

Risk:

- Moderation warnings or removals.
- Accidental NSFW/adult flagging.
- Link-only/spam perception.
- Repeated complaints that the build is confusing, slow, blank, broken, too dark, too small, untranslated or not clearly playable.

## Good Signs

- itch.io `noindex` disappears.
- Newgrounds accepts a real HTML5 archive and the preview plays before any publish attempt.
- IndieDB stays visible with screenshots and no moderation rollback.
- Comments mention concrete mechanics instead of only confusion.
- DTF-like UGC/devlog posts with screenshots/GIFs, platform-compliant playable routes, developer disclosure and specific feedback questions produce measurable community growth; prioritize similar surfaces over broad blind portal/email blasting.
- People describe Samosbor, factions, expeditions or A-Life in their own words.
- Organic links/search mentions appear outside the places already posted.
- Repeated asks are actionable: controls, first objective, performance, fullscreen, English text, map readability.

## Bad Signs

- A page is removed, hidden, reverted, flagged as spam or marked for deletion.
- itch.io remains `noindex` after the release has been public for a while.
- Cloudflare/direct build is down or serves a stale build while itch has a newer release.
- Multiple first-time players cannot start, cannot find controls, cannot leave the safe area, or hit blank canvas/black screen.
- Feedback says "link dump", "AI spam", "NSFW mislabeled", "can't tell what this is", "not playable in browser" or "too much text".
- Same copy appears across several communities and starts looking like a blast campaign.

## Report Cadence

Owner-triggered reports:

- `KPI daily` - short status table, blockers and next 3 actions.
- `KPI weekly` - trend summary, best/worst platforms, feedback themes, fixes needed, next publishing wave.
- `KPI incident` - investigate a removal, broken link, bad feedback spike or build mismatch.
- `KPI pre-post` - check whether the next planned platform is safe to post to today.

Suggested normal cadence:

- Daily for the first 7 days after release.
- Twice weekly for the next 3 weeks.
- Weekly after the campaign stabilizes.
- Immediate check after each new release upload or portal publication.

## Report Template

```md
# GIGAH|RUSH Media KPI Report - YYYY-MM-DD

## Snapshot

| Surface | Status | Signal | Risk | Action |
| --- | --- | --- | --- | --- |

## Good Signs

- ...

## Bad Signs

- ...

## Feedback Themes

- ...

## Fix Queue

- ...

## Next Actions

1. ...
2. ...
3. ...

## Owner Needed

- ...
```

## Regular Checks

Use direct checks for public surfaces where possible:

- Fetch itch.io page and check status, title and `noindex`.
- Fetch Cloudflare build and check status, title and size drift.
- Fetch public forum/wiki/portal pages and verify the title plus external links.
- Use platform dashboards only if the owner has already logged in locally and the task explicitly requires private metrics.
- For any page requiring browser challenge, report `blocked by browser challenge` instead of guessing.

Manual dashboard metrics to capture when available:

- itch.io: views, browser plays, downloads, referrers, comments, ratings, devlog views.
- Newgrounds: views/plays, votes, rating, reviews, favorites, moderation notices.
- DTF: views, comments, likes, bookmarks.
- GameDev.ru: replies, views if visible, bug/criticism themes.
- Telegram: subscribers, post views, reactions, comment themes.
- IndieDB: page views, watchers, comments, news article views after page creation.

## Current Fix Priorities

1. Newgrounds is currently RIP/eulogy, not a live game surface. Existing project `7759223` is editable, but current upload/save flow produces a `9B` ZIP attachment; keep it out of active campaign links until a real archive is accepted. Public shell recheck at 2026-05-23 21:02 UTC returned `403`, so browser/support check is still required.
2. itch.io public page still showed `noindex` on 2026-05-23 20:59 UTC after being published since 2026-05-18 and updated at 20:04 UTC. Dashboard access/settings were verified through Opera GX: the project is published, unrestricted, not unlisted, current HTML ZIP is ready/embedded, cover/screenshots exist, Metadata neighboring sections are saved, and Engines/tools is intentionally blank rather than falsely tagging Unity/Godot/Three.js. Support email was sent to `support@itch.io` from `jirnyak@gmail.com` at 20:22 UTC. Exact itch searches for `gigahrush`, `GIGAH|RUSH` and `ГИГАХРУЩ` still do not show the Tenevik page. Devlog editor confirms the launch post is published but exposes no slug/permalink field; public permalink `/devlog/1530909/-` now says the page is flagged for moderator review and requires login. Public itch iframe hash does not match local `dist/`/ZIP, so verify the intended uploaded build before further portal sync claims. Next: wait for support/indexing and recheck `noindex`/search/devlog/hash. Do not recreate the page or make duplicate announcement/devlog posts.
3. IndieDB browser/account check now confirms the game and screenshot pages open in Chrome despite shell Cloudflare `403`; GamHub, Fake Portal pending submission and FreeZonePlay contact submission still need review-window follow-up. DiscoverGG is live at `https://discovergg.com/game/gigahrush`, iDev.Games is live at `https://idev.games/game/gigah-rush`, and MyIndie is live at `https://myindie.ru/games/game/gigahrush`.
4. Gamemoor support request was sent to `contact@gamemoor.com`; monitor reply/bounce and use the public contact form if needed. Free Indie Games still needs owner/site-side contact because its public submit form is broken.
5. Querygame is not a submitted surface; public direct/search follow-up is still 404, and the submit API path previously returned `405`.
6. Chrome JavaScript-from-Apple-Events is usable in the authenticated Chrome session, but can intermittently return error 12 during long automation. In this pass the menu item remained checked; activating Chrome and retrying restored JS execution, and Game Jolt upload/publish plus Gmail sends completed through DOM/keyboard-safe actions. Do not use blind coordinate clicks. Email wave 1 sent on 2026-05-23: Alpha Beta Gamer, Free Game Planet and Games Pending. Email wave 2 sent later the same day: Armor Games, TapCraftBox and Indie Games Plus; Gamemoor support request was also sent. Email wave 3 sent at 2026-05-24 00:28-00:31 BST: VK Play Media, HorrorFam, Indie Game Buzz and Into Indie Games.
7. Keep Reddit non-NSFW. The current game classification is survival horror, not adult/NSFW.
8. CWS Games is skipped for now because it is adult-adjacent and the game is not NSFW.
9. Game Jolt is now a synced public live surface. Package `1093814`, release `1474942`, build `1960153` expose the current `4 999 557` byte ZIP, and the served Game Jolt `index.html` hash matches the current local `dist/index.html`. Use `https://gamejolt.com/games/gigahrush/1072064` as an active campaign link.
10. Update all public pages after major release changes only when there is a real new angle: final release build, trailer, major content, press kit or portal launch. For the 2026-05-23 existing-surface amplification pass, DTF is now marked successful; monitor comments and avoid a duplicate link bump. GameDev.ru is conditional/no-go until the loading/progress complaint is addressed or explicitly acknowledged in the reply; itch forum/devlog are no-go for extra replies today.
11. Next discovery should follow the DTF/2ch media-first pattern first. Immediate research shortlist is in `Docs/PRCampaign/next_wave_targets_2026-05-23.md`, `Docs/PRCampaign/ru_social_media_candidates_2026-05-23.md` and `Docs/PRCampaign/PR_12.md`: DevTribe, Pikabu gamedev via Yandex/VK/native login, Indie Spotlight, Indie Varvar's, Game Jolt devlog/media gallery, IndieDB article, TIGSource/HTML5GameDevs/GameDev.net for long devlogs, and Addicting Games / InstGame / KickoutGames as new HTML5 portal candidates. Reddit is now in monitoring after PR 13; do not add another Reddit post unless the owner explicitly requests it and the post has native media plus either allowed playable links or a self-contained no-link presentation.
12. For new media posts, portal galleries and pitch packets, use the owner-updated `tmp/prcampaign_screenshot_hunt_2026-05-23/selected_best/` folder as the asset source. Use `contact_sheet_3x3.png` for one compact square preview, the two GIFs for motion hooks, and the nine PNGs for galleries/screenshots.
13. 2ch /b/ is now live at `https://2ch.org/b/res/333348764.html`. Treat it as one high-risk/high-reach thread only: answer concrete questions or bug reports, but do not post empty bumps, duplicate threads, fake-user replies or extra mirrors unless asked. Current first feedback themes: first-run usability, engine/tech credibility, unclear goals/multiplayer expectation, AI-content suspicion and requests for more recognizable human/social monster types.
14. Reddit/PBBG push executed in `Docs/PRCampaign/PR_13.md`: r/PBBG, r/WebGames and r/Games Indie Sunday are live at initial authenticated check and were corrected with direct GIF/screenshot URLs plus allowed playable links; PBBG.com is pending review but its `/games` front page now publicly links the r/PBBG post; r/IndieDev was removed by moderator/automoderation. Next action is monitoring and replies only, not immediate reposting.
15. PR 14 executed the owner-requested continuation/fix pass: Game Jolt short post got a visible media/playable owner comment, Game Jolt full media update is live, IndieDB news is awaiting authorisation, HTML5GameDevs requires registration/password/Terms before posting, DevTribe add path is `403`, and Pikabu remains login-gated. No existing links were removed.

## 2026-05-23 PR 11 Public Upload/Application Pass

Owner instruction was to make/upload public. Durable log: `Docs/PRCampaign/PR_11.md`.

- MyIndie is now public/playable at `https://myindie.ru/games/game/gigahrush`. The listing uses RU copy, Web (HTML5), engine `Another`, RU/EN languages, genres Shooter/RPG/Action/Survival/Horror, content warnings, itch/direct/Telegram links, cover, 3 screenshots and the current `itch/gigahrush-itch.zip` (`4 999 557` bytes). Public page and Web iframe were verified in browser after publish.
- iDev.Games was rechecked and remains public/playable at `https://idev.games/game/gigah-rush`; public page shows `4 plays` and `This game has not been verified yet`, while the edit page says the game is released and visible to everyone.
- Kongregate Developer Application was submitted; this is not a public game listing yet. Wait for approval before Alpha upload.
- Newgrounds remains blocked: Chrome is not logged in, and the durable blocker is still RIP/eulogy plus `9B` ZIP attachment in project `7759223`.

## 2026-05-23 Account-Gated Quick Listing Check

Checked public requirements/current URLs for Game Jolt, iDev.Games, MyIndie, IndieHub and Kongregate without login or submission.

- Game Jolt is public at `https://gamejolt.com/games/gigahrush/1072064`; package `1093814` / release `1474942` / build `1960153` serves the current `4 999 557` byte HTML ZIP, and direct `serve.gamejolt.net` check reached `ГИГАХРУЩ - САМОСБОР` with visible canvases. Next step is monitoring plus optional extra gallery media/devlog through a trusted UI path.
- MyIndie was completed after owner public-upload instruction: live listing is `https://myindie.ru/games/game/gigahrush`.
- iDev.Games is now public at `https://idev.games/game/gigah-rush`; the logged-in edit page says the game has been released and is visible to everyone. Treat future work as monitoring/media polish, not submission.
- IndieHub is currently blocked as a quick listing: public `/game/add` returns an error and asks users to contact administration in Telegram. Use support/account check before any submission.
- Kongregate is now application-submitted, not public: Developer Application is in review, and publish remains impossible until approval/review.

## 2026-05-23 Участок 4: quick RU/listing public recheck

No login, no submission, no final-click actions. Public pages checked for MyIndie, IndieHub, iDev.Games and Gamemoor.

| Surface | Current public state | Can do today | Blocker / risk |
| --- | --- | --- | --- |
| MyIndie | Superseded by PR 11: public playable listing is live at `https://myindie.ru/games/game/gigahrush`; the earlier `/games/create` login blocker is resolved for this campaign pass. | Monitor page/Web iframe/comments and avoid duplicate resubmission. | Site moderation may still happen after publication. |
| IndieHub | Homepage exposes login/registration, `добавить игру`, rules and Telegram support. Public `https://indiehub.ru/game/add` returns an error: page does not exist and asks to contact administration in Telegram. | Only ask support for working add-game path or test after owner login. | Not a ready quick listing until support/account reveals a working form. |
| iDev.Games | `https://idev.games/game/gigah-rush` is live; public page returns `200 OK`, title `Gigah Rush - Free Online Browser Game`, no `noindex`, and embed `/embed/gigah-rush`. | Monitor moderation/plays/comments and polish media later if needed. | No account action needed for basic public status. |
| Gamemoor | `https://gamemoor.com/contact` says developer portal is open and submissions go through review in a few days. Public `https://gamemoor.com/developer` redirects to login; `/submit`, `/dashboard`, `/my-games` are 404; `/games/add` redirects to 404. | If owner can log in, try `/developer`; otherwise send/contact support asking for developer access or submit URL. | Not instant-public from public web. Existing account previously could not reach developer portal, so support may be required. |

Classification after PR 11: MyIndie and iDev.Games are public; Gamemoor is review-queue after portal access; IndieHub is support-blocked.

## 2026-05-23 Expanded Account-Gated Portal Recheck

Public recheck at 20:31 UTC / 21:31 BST, with no login and no submission, covered the requested six account-gated portals: MyIndie, iDev.Games, IndieHub, Kongregate, CrazyGames and Gamemoor.

| Portal | Current classification | Exact owner action |
| --- | --- | --- |
| MyIndie | Completed/public after PR 11. Live URL: `https://myindie.ru/games/game/gigahrush`; uploaded current HTML5 ZIP plus cover and screenshots. | Monitor moderation, plays/comments, download link and Web iframe availability. |
| iDev.Games | Already public at `https://idev.games/game/gigah-rush`; edit page confirms released and visible to everyone. | Monitor moderation/plays/comments and polish media later through a trusted UI path. |
| IndieHub | Support-blocked, not safe as a quick listing. Homepage exposes login/registration, `добавить игру`, rules and Telegram support, but public `/game/add` currently returns “page does not exist” and asks users to contact administration. Rules require publisher rights and ban spam, malware, illegal, misleading and infringing content. | Owner either logs in to see if a hidden add flow appears or contacts IndieHub Telegram support for the current add-game path. No final-click until a real working form and draft/public state are known. |
| Kongregate | Developer Application submitted after PR 11. Still not quick and not instant: the game cannot be uploaded/published until Kongregate approves the developer application and later reviews the Alpha submission. | Wait for Kongregate response; after approval, prepare Alpha materials with browser playability, screenshots, description, instructions, voluntary age rating, AI declaration and English option. |
| CrazyGames | SDK/portal-build track, not quick PR. Basic Launch can go live after Basic Implementation and QA without CrazyGames-specific integration; Full Launch requires Full Implementation including SDK. Public requirements include initial download `<=50MB`, total `<=250MB`, file count `<=1500`, Chrome/Edge compatibility, readable UI at listed iframe/mobile sizes, English localization, PEGI 12 fit, no custom fullscreen button and no cross-promotion. | Owner logs into the JS Developer Portal only after accepting a separate CrazyGames build task. Agent should first make/verify a portal build: English path, no external playable-link CTAs, no in-game fullscreen button, iframe readability/performance, then submit Basic Launch preview/QA. Full Launch needs SDK events/data/user work. |
| Gamemoor | Review queue after portal access; currently access/support-blocked. Contact page says the developer portal is open and submissions are reviewed within a few days; `/developer` redirects unauthenticated users to login; public `/submit`, `/dashboard`, `/my-games` return 404 and `/games/add` redirects to 404. Terms say submissions are reviewed for PEGI 3-16 and no NSFW. | Owner logs in and opens `/developer`. If it still redirects/has no access, send support request for developer portal access or the current submit URL for account `jirnyak`. Confirm the game is presented as non-NSFW survival horror, max PEGI 16, before submitting. |

## 2026-05-23 itch.io Listing Incident Recheck

Public recheck at 20:20 UTC / 21:20 BST:

- `https://tenevik.itch.io/gigahrush` returns `200 OK`, is visible on `https://tenevik.itch.io`, has cover/screenshots/GIFs and a `Run game` HTML5 iframe.
- The public page still contains `<meta content="noindex" name="robots"/>`.
- Search inside itch for `gigahrush`, `GIGAH|RUSH` and `ГИГАХРУЩ` does not return the Tenevik page; it returns older unrelated/similarly named projects.
- The page info panel says `Published 18 May 2026 @ 04:20 UTC` and the latest public recheck saw `Updated 23 May 2026 @ 20:04 UTC`; the current iframe is `html/17651708/index.html?v=1779563799`.
- Opera GX dashboard source check found `published:true`, `active:true`, `restricted:false`, `unlisted:false`, current upload `gigahrush-itch.zip` ready/embedded at `4 999 557` bytes, cover plus 14 screenshots/GIFs, genre `shooter`, tags including `survival-horror`, AI disclosure false, Release info saved as `No license` / `No license` / `2026-05-21 23:00:00 UTC` / blank publisher, Classification saved as `keyboard,mouse,touchscreen`, `hour`, `en,ru`, NSFW/content warning off, Engines/tools blank, and five compact External links saved. Devlog editor source confirms the post is published, but there is no exposed slug/permalink field.
- The devlog index and RSS expose `https://tenevik.itch.io/gigahrush/devlog/1530909/-`, but that permalink returns public `404`.

Action: support email was sent to `support@itch.io` from `jirnyak@gmail.com` at 2026-05-23 20:22 UTC with the fresh public and dashboard facts. This is now a support/indexing-wait blocker, not a reason to duplicate the page or spam itch community surfaces.

Dashboard access note: earlier safe Chrome DOM-only check of `https://itch.io/game/edit/4587160` redirected to `https://itch.io/login` and Cloudflare `Performing security verification`, Ray ID `a0069099f91dc198`; Opera GX later had a valid owner session and was used for the successful dashboard source checks.
