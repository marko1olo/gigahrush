# itch.io Upload Checklist

1. Edit game page: `https://itch.io/game/edit/4587160`.
2. Paste `description_ru_approved.html` into the description editor. Keep `description_ru_approved.md` as the exact source of truth; do not rewrite, shorten, or remove its existing text.
3. Apply theme colors from `theme_settings.md`.
4. Upload:
   - `assets/gigahrush_cover_630x500.png` as cover.
   - `assets/gigahrush_header_bg_1920x620.png` as header/background hero if itch exposes header image.
   - `assets/gigahrush_banner_1920x620.png` as an extra promo/banner image if itch exposes social/media slots.
   - `assets/gigahrush_background_1920x1080.png` as page background.
   - `assets/gigahrush_social_1200x630.png` as social/card image if exposed.
5. Replace or reorder screenshots/GIFs with the approved `upload=true` files. For the two GIFs, use the optimized `approved_frontpage_itch/` copies because itch rejects gallery files above 3 MB:
   - `approved_frontpage_itch/anim_hell_blinking_eyes.gif`
   - `approved_frontpage_itch/anim_underhell_maronary_samosbor_loop.gif`
   - `approved_frontpage/hell_02-hell-maronary-samosbor.png`
   - `approved_frontpage/hell_03-underhell-gate-pack.png`
   - `approved_frontpage/hell_05-void-eye-protocols.png`
   - `approved_frontpage/hell_06-darkness-route-blackout.png`
   - `approved_frontpage/hell_07-procedural-wall-snake.png`
   - `approved_frontpage/hell_09-smog-false-safe-block.png`
   - `approved_frontpage/loc_03-ministerstvo-raionsovet-archive.png`
   - `approved_frontpage/loc_04-kollektory-maintenance.png`
   - `approved_frontpage/loc_07-krysha-antenny.png`
   - `approved_frontpage/extra_01-living-start-hud.png`
   - `approved_frontpage/extra_03-living-monster-ring-clean.png`
   - `approved_frontpage/extra_04-living-combat-hud.png`
6. If itch exposes extra capsule/social media slots, use:
   - `capsules/gigahrush_capsule_wide_960x300.png`
   - `capsules/gigahrush_capsule_315x250.png`
   - `assets/gigahrush_media_wall_1920x1080.png`
7. Do not upload source service files from `screenshots/frontpage-review`: `anim_hell_blinking_eyes_preview.png`, `anim_hell_blinking_eyes_strip.png`, or `contact_sheet.png`.
8. If cover/header crop badly, use these alternatives:
   - `visual_variants/gigahrush_cover_variant_red_alarm_630x500.png`
   - `visual_variants/gigahrush_cover_variant_green_maronary_630x500.png`
   - `visual_variants/gigahrush_cover_variant_white_veretar_630x500.png`
   - `visual_variants/gigahrush_header_clean_no_title_1920x620.png`
9. If custom CSS is enabled, paste `custom_css.css`; if not, skip it and use the color settings.
10. Make screenshot sidebar visible. The current live CSS hides `.right_col`; this wastes the strongest visual proof.
11. Save page.
12. Open the public page in a logged-out/incognito browser and verify:
   - embedded game still loads;
   - text is readable on desktop and mobile width;
   - screenshots are visible;
   - no white default theme remains;
   - online version link works.
