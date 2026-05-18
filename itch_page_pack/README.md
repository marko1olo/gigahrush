# GIGAH|RUSH itch Page Pack

Status: ready for upload, live itch edit blocked by auth/Cloudflare in current non-focus automation path.

## Main Files

- `description_ru.html` - paste into itch description editor if HTML is accepted.
- `description_ru.md` - fallback plain Markdown version.
- `description_ru_overkill.html` - stronger default copy for the current page pass.
- `description_ru_overkill.md` - fallback Markdown for the stronger copy.
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

## Verification Artifacts

- `local_preview_desktop.png` - desktop preview screenshot.
- `local_preview_mobile.png` - mobile-width preview screenshot.
- `local_preview_v3.html` - v3 preview including clean header, GIF, and contact sheet.
- `source_screenshots/` - current public itch screenshots downloaded from the live page and reused as visual proof.

## Live Edit Blocker

Current headless/non-focus route cannot authenticate into the itch editor:

- `https://itch.io/login` returns Cloudflare security verification in headless Edge.
- Existing Edge session has no DevTools remote debugging port.
- Active Edge profile cookies are locked by the running browser process.
- Firefox profile has no itch.io session cookies.

Do not claim the live page is updated until `https://tenevik.itch.io/gigahrush` is checked after saving.
