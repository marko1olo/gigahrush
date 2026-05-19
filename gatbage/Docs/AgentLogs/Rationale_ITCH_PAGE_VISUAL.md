# Rationale_ITCH_PAGE_VISUAL

Date: 2026-05-18
Status: PENDING VERIFICATION

## Decision 1

Problem: User asked to edit the live itch.io page, but no batch XML ID/domain exists and browser editor access is not yet proven.
Solution: Use `ITCH_PAGE_VISUAL` as local work ID, keep state/rationale under `C:/gigahrush/Docs`, and treat live-page edits as PENDING until authenticated access is objectively confirmed.
Rejected Alternatives: Pretending an ID/task count exists; reporting live edits without checking the account/editor path.
Scalability potential: Page assets must read on weak browsers with static images and restrained CSS; stronger devices can see denser screenshot/banner detail without blocking page usability.
Hardware Impact: Low-end i3/MX350 equivalent web path avoids heavy animated backgrounds; expected page-side gain is avoiding avoidable long paints, not game-frame microseconds.

## Decision 2

Problem: Visual direction could collapse into generic horror marketing or AI-sounding copy.
Solution: Build copy from local docs: armed tenant-stalker, 1024x1024 toroidal Khrushchev megastructure, expeditions, factions, contracts, samosbor as local emission, rare variants Истотит/Маронарий/Веретар.
Rejected Alternatives: Directly copying Samosbor wiki prose; explaining the meme instead of selling the game; using “immersive procedural survival experience” language.
Scalability potential: Low/Middle/High/Ultra presentation is editorial density, not runtime simulation: minimal page still readable; high/ultra uses richer banner/screenshot composition.
Hardware Impact: Static authored imagery and HTML copy cost negligible compared with animated CSS/video backgrounds; estimated saved page render time depends on browser, unmeasured.

## Decision 3

Problem: itch HTML5 pages default to hiding the screenshot column, and the live page currently hides the strongest visual proof.
Solution: Produce a package that makes screenshots visible via layout/theme settings and custom CSS where available; also embed screenshot-derived card art in static banner/social assets so the page still carries game pixels if the sidebar stays hidden.
Rejected Alternatives: Relying only on text; using animated GIF/video as the first solution; using a clean modern landing-page look that contradicts the game.
Scalability potential: Low tier gets static compressed PNGs and readable text; middle/high/ultra presentation gets denser screenshot collage, glow, scanline, and concrete texture without runtime animation.
Hardware Impact: Static PNGs total under 1.5 MB for the full pack; page paint impact is lower than animated CSS/video. Exact browser microseconds are PENDING VERIFICATION.

## Decision 4

Problem: Live browser edit cannot be completed through current non-focus headless path.
Solution: Record blocker, leave exact HTML/Markdown/CSS/theme/upload package, and do not fake a live edit. Headless login hits Cloudflare verification; active Edge session cookies cannot be copied while Edge is running.
Rejected Alternatives: Closing the user's active Edge session without permission; decrypting credentials; claiming page update from local files.
Scalability potential: Manual upload path preserves the same visual result once authenticated editor access is available.
Hardware Impact: No runtime impact. Browser automation cost irrelevant because live auth blocked before editing.

## Decision 5

Problem: The user asked to continue work after the initial blocker.
Solution: Continue by packaging the full deliverable into a zip and verifying dimensions/sizes of all generated assets plus desktop/mobile preview screenshots.
Rejected Alternatives: Waiting idle for account access; ending with only chat text.
Scalability potential: The page pack can be applied in the itch UI without more creative decisions; optional CSS provides high presentation density while base theme settings still work without CSS.
Hardware Impact: Full zip is about 5.8 MB including source screenshots and previews; actual upload assets are smaller and static. No per-frame or continuous browser cost.

## Decision 6

Problem: First description was factual but still too close to a feature brief.
Solution: Add `description_ru_overkill.*` with a stronger human hook: you are not a hero, the door is not a level, samosbor has social aftermath.
Rejected Alternatives: More adjectives; profanity-heavy public copy; lore encyclopedia dump.
Scalability potential: The first paragraph works even if itch strips formatting; full HTML adds structure for users who scroll.
Hardware Impact: Text cost is negligible. No runtime or browser animation impact.

## Decision 7

Problem: Raw screenshots prove the game exists, but storefront thumbnails need clearer framing.
Solution: Generate enhanced screenshots from actual public screenshots with captions, frames, and restrained scanline treatment.
Rejected Alternatives: Fake mockups; AI-painted scenes; trailer-only presentation.
Scalability potential: Low devices see static PNG proof; high-end page presentation gets denser composition without any live render cost.
Hardware Impact: Four enhanced screenshots are ~5.4 MB total before itch recompression. Page-side continuous cost remains zero.

## Decision 8

Problem: itch and social surfaces use different aspect ratios; a single cover cannot carry them all.
Solution: Add wide capsule, small capsule, and media-wall assets with ASCII-safe filenames and verified dimensions.
Rejected Alternatives: Stretching the same cover into every slot; relying on itch default crop.
Scalability potential: Each slot gets composition built for its ratio, preserving readability on mobile and desktop.
Hardware Impact: Static upload assets only. No frame-time cost.

## Decision 9

Problem: The package still required the operator to infer exact editor order.
Solution: Add `ITCH_EDITOR_RUNBOOK.md` and `upload_manifest.json` with field values, upload roles, dimensions, priority, and verification rule.
Rejected Alternatives: Leaving instructions only in chat; assuming the itch UI will make the right crop/layout obvious.
Scalability potential: Low tier applies base fields/colors only; middle/high/ultra adds screenshots, GIF, poster, contact sheet, and CSS without changing copy.
Hardware Impact: No runtime cost. Reduces human error during the editor pass.

## Decision 10

Problem: Static assets were strong but still depended on one cover/header crop.
Solution: Generate three cover variants, one no-title header, one poster, one contact sheet, and a 640x360 samosbor GIF from real screenshots.
Rejected Alternatives: AI concept art; fake monsters not visible in the current build; heavy autoplay video as primary proof.
Scalability potential: Weak devices can skip the GIF and still get static PNGs; high-tier presentation can use GIF/contact-sheet density.
Hardware Impact: GIF is 2757445 bytes and optional. PNGs remain static. No continuous script/CSS animation cost.

## Decision 11

Problem: Existing custom CSS had a placeholder URL that could become a broken background if pasted unchanged.
Solution: Remove the unresolved URL and keep CSS paste-safe, relying on itch theme upload slots for images.
Rejected Alternatives: Trusting a future replacement step; embedding external URLs manually before the image host is known.
Scalability potential: CSS can be pasted as-is on low-effort apply, while uploaded theme images still provide visual overkill where supported.
Hardware Impact: Fewer failed image requests; exact browser microseconds not measured.

## Decision 12

Problem: The live page might have changed while working.
Solution: Recheck public `https://tenevik.itch.io/gigahrush` after v3 packaging.
Rejected Alternatives: Using stale earlier observation; claiming unchanged without a current GET.
Scalability potential: The status file remains evidence-based for the next agent/operator.
Hardware Impact: No game/runtime impact.
