# GIGAH|RUSH itch Editor Runbook

Live editor target: `https://itch.io/game/edit/4587160`
Public verification target: `https://tenevik.itch.io/gigahrush`

Use this order. It avoids relying on custom CSS first, because CSS access can be missing or stripped.

## 1. Core Page Fields

- Title: `GIGAH|RUSH`
- Short description: `Вылазки, патроны и самосбор внутри хрущёвки размером с город.`
- Classification: `Game`
- Kind of project: `HTML`
- Genre: `Shooter`
- Suggested pricing: keep current setting unless intentionally changing monetization.

Tags:
`Survival Horror`, `Procedural Generation`, `Life Simulation`, `Dungeon Crawler`, `Roguelike`, `Doom`, `Maze`, `Russian`, `Pixel Art`, `Browser`, `Singleplayer`, `Atmospheric`, `Horror`

Description:
- Primary paste: `description_ru_overkill.html`
- Fallback paste if itch strips HTML: `description_ru_overkill.md`

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

Primary screenshot order:

1. `enhanced_screenshots/gigahrush_screen_01_combat.png`
2. `enhanced_screenshots/gigahrush_screen_02_contract.png`
3. `enhanced_screenshots/gigahrush_screen_03_inventory.png`
4. `enhanced_screenshots/gigahrush_screen_04_act_hall.png`

Extra media, if itch accepts more images/GIFs:

1. `animated/gigahrush_samosbor_loop_640x360.gif`
2. `visual_variants/gigahrush_contact_sheet_1600x900.png`
3. `assets/gigahrush_media_wall_1920x1080.png`
4. `visual_variants/gigahrush_vertical_poster_1080x1620.png`

Cover alternatives, if the default cover crops badly:

1. `visual_variants/gigahrush_cover_variant_red_alarm_630x500.png`
2. `visual_variants/gigahrush_cover_variant_green_maronary_630x500.png`
3. `visual_variants/gigahrush_cover_variant_white_veretar_630x500.png`

## 4. Layout

- Embed size: `1280 x 720`.
- Keep the game embed first.
- Make the screenshot/sidebar column visible. Current public page hides it with `.right_col { display: none; }`; remove that if visible in the editor.
- If custom CSS is available, paste `custom_css.css`. It is now paste-safe and contains no local URL placeholder.

## 5. Verification

After saving, open the public page in an incognito or logged-out browser and check:

- the public page is no longer white/default;
- the description starts with `ГИГАХРУЩ - это вылазки...`;
- the four enhanced screenshots are visible;
- the embed still launches;
- mobile width does not overflow;
- `https://gigahrush.bileter.workers.dev` is clickable.

Do not report the live page as updated until this public check passes.
