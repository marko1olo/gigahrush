# GIGAH|RUSH KPI Agent

Role: track public media presence for GIGAH|RUSH across published pages, community posts, portals, wikis, search/indexing surfaces and campaign backlog. This file is an operating brief for a future agent. It does not grant permission to spam, manipulate votes, hide developer affiliation or bypass platform moderation.

Current date baseline: 2026-05-22.

## Operating Rules

- Report facts first: availability, indexing, visible links, comments, moderation state, traffic signals and concrete next actions.
- Do not post, repost, bump, vote, rate, ask for votes, mass-comment or contact media unless the owner explicitly asks for that action.
- Do not ask for passwords in chat. If access is needed, ask the owner to log in through Opera GX or Chrome and say `готово`; request only one-time codes if a site asks for them.
- Keep developer affiliation clear in every recommendation.
- Treat horror as survival horror, not NSFW, unless a platform questionnaire itself requires a stricter content label.
- When a platform blocks automation with Cloudflare, captcha, account validation or moderation review, record the blocker exactly and switch to manual-owner instructions.

## Core Links

| Surface | URL | Status | What To Watch |
| --- | --- | --- | --- |
| itch.io game page | https://tenevik.itch.io/gigahrush | Live, current release uploaded by owner. Public HTML still showed `noindex` on 2026-05-22 after release update. | Page availability, `noindex`, screenshots/GIFs, tags, comments, downloads/plays if dashboard access exists. |
| Direct Cloudflare build | https://gigahrush.bileter.workers.dev | Live, 200 OK, no public `noindex` detected on 2026-05-22. | Availability, title, boot health, console/runtime errors, whether final release matches itch build. |
| Telegram | https://t.me/gigah_rush | Public campaign/contact link. | Subscriber count, posts, comments/reactions if visible, whether this remains valid contact. |
| Newgrounds | https://www.newgrounds.com/portal/view/1033564 | Published HTML5 game page. Final HTML5 archive was updated and published again on 2026-05-22; public iframe returned 9,262,219 bytes. | Page availability, rating, votes, reviews, playability, moderation messages, visible links to itch/Telegram. |
| DTF | https://dtf.ru/indie/5077801-gigahrush-brauzernyj-survival-horror | Published RU devlog post. | Views, likes, bookmarks, comments, negative repeated issues, whether links still render. |
| GameDev.ru | https://gamedev.ru/projects/forum/?id=295485 | Published forum topic. | Replies, criticism, technical bug reports, moderation state, repeated asks. |
| itch.io Release Announcements | https://itch.io/t/6385827/gigahrush-free-browser-survival-horror-in-an-endless-concrete-apartment-block | Published and fixed. | Views, replies, whether the image/GIF still embeds, link health. |
| itch.io Devlog | https://tenevik.itch.io/gigahrush/devlog/1530909/- | Published. | Views/likes if accessible, comments, link health. |
| GamHub | https://gamhub.net/website_submit/ | Submitted 2026-05-22 through public form; API returned `{"code":200,"msg":"Submit success"}`. No public listing visible in search yet. | Check search/listing after 24-48h, final game URL, tags, whether itch/direct/Telegram links survive review. |
| Samosbor Archive Fandom RU | https://samosborarchive.fandom.com/ru/wiki/ГИГАХРУЩ | Published game page. | Page availability, edits/reverts, external link retention, categories. |
| samosb0r Fandom RU | https://samosb0r.fandom.com/ru/wiki/ГИГАХРУЩ | Published game page. | Page availability, edits/reverts, external link retention, categories. |
| Self-Assembly Wiki EN / Fandom | https://samosborarchive-en.fandom.com/wiki/GIGAH_RUSH | Published game page. | Page availability, edits/reverts, external link retention, EN terminology. |
| Reddit r/playmygame | https://old.reddit.com/r/playmygame/comments/1tkteuc/gigahrush_free_browser_survival_horror_arpg/ | Old post exists, but is not the campaign standard because the game is not NSFW. | If still public, do not use as copy source. Watch removal/comments only. |
| IndieDB | https://www.indiedb.com/games/add | Blocked for automation by Cloudflare managed challenge even after browser cookies appeared. | Owner must complete browser flow. Once created, add the final game URL here and move it to active monitoring. |
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
- Newgrounds keeps the game public and starts receiving plays/reviews.
- Comments mention concrete mechanics instead of only confusion.
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

1. IndieDB cannot be automated from shell because Cloudflare still returns `403` managed challenge. Owner should complete the browser flow, then the agent can continue if the page becomes accessible or the owner gives page fields/screenshots.
2. itch.io public page still showed `noindex` on 2026-05-22. Recheck after moderation/indexing delay; if it persists, inspect dashboard/indexing warnings.
3. Keep Reddit non-NSFW. The current game classification is survival horror, not adult/NSFW.
4. Update all public pages after major release changes only when there is a real new angle: final release build, trailer, major content, press kit or portal launch.
