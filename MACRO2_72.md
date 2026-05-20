# MACRO2_72: Itch Pack Verifier

Модель: GPT-5.5, reasoning extra high.

Цель: verify itch pack assets, dimensions, manifest paths, HTML copy and zip root before upload.

Критично: page pack contains many generated images/scripts; upload mistakes are easy and expensive to notice late.

Ownership: `itch_page_pack/**`, `scripts/build-itch.mjs`, `package.json`, new `scripts/verify-itch-pack.mjs`.

Читать: `itch_page_pack/README.md`, `itch_page_pack/upload_manifest.json`, `scripts/build-itch.mjs`.

Deliverables:
- `npm run itch:verify` read-only verifier;
- checks dimensions of required PNG/GIF assets, file presence, root zip structure;
- reports stale local previews/screenshots.

Проверки: `npm run itch:build`, `npm run itch:verify`.

Параллельные ограничения: no visual redesign in verifier task.
