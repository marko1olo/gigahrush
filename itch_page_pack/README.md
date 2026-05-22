# GIGAH|RUSH itch Page Pack

Status: live itch page updated and public-probed on 2026-05-22.

## Main Files

- `description_ru.html` - legacy description fragment; do not use for the current approved page pass.
- `description_ru.md` - legacy Markdown fallback; do not use for the current approved page pass.
- `description_ru_overkill.html` - legacy stronger copy; do not use for the current approved page pass.
- `description_ru_overkill.md` - legacy stronger Markdown fallback; do not use for the current approved page pass.
- `description_ru_approved.html` - current user-approved itch description as an HTML fragment.
- `description_ru_approved.md` - exact user-approved source text. Do not rewrite or remove existing text; only append after it.
- `itch_fields_ru.md` - exact title/short-description/tags/screenshot order.
- `ITCH_EDITOR_RUNBOOK.md` - exact editor order for the live itch page.
- `upload_manifest.json` - machine-readable upload roles, dimensions, and priority.
- `copy_variants_ru.md` - backup page hooks, short descriptions, and devlog titles.
- `devlog_launch_ru.md` - optional first devlog/update text.
- `theme_settings.md` - exact color/layout/tag settings.
- `custom_css.css` - optional CSS if custom CSS is enabled on the itch account.
- `upload_checklist.md` - exact live-page steps.
- `local_preview.html` - local visual preview.

## Assets

- `assets/gigahrush_cover_630x500.png` - cover image.
- `assets/gigahrush_header_bg_1920x620.png` - header/theme background.
- `assets/gigahrush_banner_1920x620.png` - promo/banner image with title and screenshot cards.
- `assets/gigahrush_background_1920x1080.png` - subtle page background.
- `assets/gigahrush_social_1200x630.png` - social/card image.
- `assets/gigahrush_media_wall_1920x1080.png` - large media collage.
- `enhanced_screenshots/` - improved itch screenshot set with captions.
- `capsules/` - wide and small capsule-style promo images.
- `visual_variants/` - extra covers, clean header, poster, contact sheet.
- `animated/gigahrush_samosbor_loop_640x360.gif` - optional animated screenshot media.
- `approved_frontpage/` - current approved upload set copied from `screenshots/frontpage-review` (`upload=true` only): 12 PNG screenshots and 2 GIFs.
- `approved_frontpage_itch/` - itch-safe optimized copies of the two approved GIFs, used for the live gallery because itch rejects screenshot media above 3 MB.

## Verification Artifacts

- `npm run itch:verify` - read-only local verifier for manifest paths, required asset dimensions, HTML copy shape, stale preview/screenshot artifacts, and ZIP root structure.
- `local_preview_desktop.png` - desktop preview screenshot.
- `local_preview_mobile.png` - mobile-width preview screenshot.
- `local_preview_v3.html` - v3 preview including clean header, GIF, and contact sheet.
- `source_screenshots/` - current public itch screenshots downloaded from the live page and reused as visual proof.

## Live Page State

The current live page uses `description_ru_approved.html`, the 12 approved PNG screenshots, and the 2 optimized GIFs from `approved_frontpage_itch/`.

Do not claim a future live-page update until `https://tenevik.itch.io/gigahrush` is checked after saving.
