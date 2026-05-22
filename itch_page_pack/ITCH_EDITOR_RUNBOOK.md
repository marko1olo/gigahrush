# GIGAH|RUSH itch Editor Runbook

Live editor target: `https://itch.io/game/edit/4587160`
Public verification target: `https://tenevik.itch.io/gigahrush`

Use this order. It avoids relying on custom CSS first, because CSS access can be missing or stripped.

## 1. Core Page Fields

- Title: `GIGAH|RUSH`
- Short description: `Выживание, вылазки и САМОСБОР внутри бесконечной хрущёвки.`
- Classification: `Game`
- Kind of project: `HTML`
- Genre: `Shooter`
- Suggested pricing: keep current setting unless intentionally changing monetization.

Tags:
`Survival Horror`, `Procedural Generation`, `Life Simulation`, `Dungeon Crawler`, `Roguelike`, `Doom`, `Maze`, `Russian`, `Pixel Art`, `Browser`, `Singleplayer`, `Atmospheric`, `Horror`

Description:
- Primary paste: `description_ru_approved.html`
- Exact user-approved source: `description_ru_approved.md`
- Do not rewrite, shorten, or remove this description text. Only append after it if extra copy is explicitly needed.
- Public page copy markers for verification: `Выживание в бесконечном бетонном лабиринте`, `Ты не проходишь уровни. Ты живёшь внутри огромного дома`, `Сотни этажей`

## 2. Theme

Colors:

- Background: `#08090A`
- Secondary background / inner column: `#12110F`
- Text: `#D8D0B8`
- Link: `#E6BC57`
- Button: `#B73A2F`
- Button text: `#FFF1D0`
- Border: `#4D4034`

Images:

- Cover image: `assets/gigahrush_cover_630x500.png`
- Page background: `assets/gigahrush_background_1920x1080.png`
- Header/hero image if there is a header slot: `visual_variants/gigahrush_header_clean_no_title_1920x620.png`
- Social/card image if available: `assets/gigahrush_social_1200x630.png`

If the header slot overlays the page title, use the clean no-title header. If it does not overlay the title, `assets/gigahrush_header_bg_1920x620.png` is acceptable.

## 3. Screenshots And Media

Approved media order from `screenshots/frontpage-review/PICKLIST.md` (`upload=true` only). Use the two `approved_frontpage_itch/` GIFs for itch upload; they are optimized copies of the approved source GIFs and stay under itch's 3 MB screenshot limit.

1. `approved_frontpage_itch/anim_hell_blinking_eyes.gif`
2. `approved_frontpage_itch/anim_underhell_maronary_samosbor_loop.gif`
3. `approved_frontpage/hell_02-hell-maronary-samosbor.png`
4. `approved_frontpage/hell_03-underhell-gate-pack.png`
5. `approved_frontpage/hell_05-void-eye-protocols.png`
6. `approved_frontpage/hell_06-darkness-route-blackout.png`
7. `approved_frontpage/hell_07-procedural-wall-snake.png`
8. `approved_frontpage/hell_09-smog-false-safe-block.png`
9. `approved_frontpage/loc_03-ministerstvo-raionsovet-archive.png`
10. `approved_frontpage/loc_04-kollektory-maintenance.png`
11. `approved_frontpage/loc_07-krysha-antenny.png`
12. `approved_frontpage/extra_01-living-start-hud.png`
13. `approved_frontpage/extra_03-living-monster-ring-clean.png`
14. `approved_frontpage/extra_04-living-combat-hud.png`

Do not upload `anim_hell_blinking_eyes_preview.png`, `anim_hell_blinking_eyes_strip.png`, or `contact_sheet.png`; those are marked service-only in the approved source folder.

Cover alternatives, if the default cover crops badly:

1. `visual_variants/gigahrush_cover_variant_red_alarm_630x500.png`
2. `visual_variants/gigahrush_cover_variant_green_maronary_630x500.png`
3. `visual_variants/gigahrush_cover_variant_white_veretar_630x500.png`

## 4. Layout

- Embed size: `1280 x 720`.
- Keep the game embed first.
- Make the screenshot/sidebar column visible. Current public page hides it with `.right_col { display: none; }`; remove that if visible in the editor.
- If custom CSS is available, paste `custom_css.css`. It is now paste-safe and contains no local URL placeholder.

## 5. Editor Preview Check

The editor preview only proves that authenticated editor state looks right. It does not prove that the public page has the saved page, latest upload, or uncached copy.

Before saving, use preview/editor UI only for these checks:

- title, short description, genre, tags, colors, approved screenshots/GIFs, and embed settings match this runbook;
- the frontpage copy markers are present in the description;
- the screenshot/sidebar column is visible in the editor preview;
- the game embed is still first and set to `1280 x 720`.

Do not report a live-page update from editor preview alone.

## 6. Public Logged-Out Verification

After saving, verify the page that itch actually serves while logged out. The normal probe path is a public `GET`; it does not need itch credentials and does not send cookies.

Dry-run the configured URL and required markers:

```bash
node itch_page_pack/probe_itch_editor.js --dry-run
```

Probe the public page from `upload_manifest.json`:

```bash
node itch_page_pack/probe_itch_editor.js
```

Override the URL if checking a staging or renamed itch page:

```bash
node itch_page_pack/probe_itch_editor.js --url https://tenevik.itch.io/gigahrush
```

If a browser/cache mismatch is suspected, save the logged-out HTML and check the exact file:

```bash
curl -L https://tenevik.itch.io/gigahrush -o /tmp/gigahrush-itch.html
node itch_page_pack/probe_itch_editor.js --html /tmp/gigahrush-itch.html
```

For a quick manual marker scan:

```bash
curl -L https://tenevik.itch.io/gigahrush | rg "GIGAH\\|RUSH|Выживание в бесконечном бетонном лабиринте|Ты не проходишь уровни|Сотни этажей"
```

The script asserts:

- title marker: `GIGAH|RUSH`;
- copy markers: short description, frontpage description text, and `https://gigahrush.bileter.workers.dev`;
- key image markers: the 14 current live itch image ids from `upload_manifest.json`;
- version marker: none for the frontpage pass.

Also open the public page in an incognito or logged-out browser and check:

- the public page is no longer white/default;
- the description starts with `Выживание в бесконечном бетонном лабиринте`;
- all 14 approved media files are visible in the itch media list or page gallery;
- the embed still launches;
- mobile width does not overflow;
- `https://gigahrush.bileter.workers.dev` is clickable.

Do not report the live page as updated until the logged-out public probe and the manual public check both pass.
