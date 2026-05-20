# MACRO2_73: Itch Live Page Verifier

Модель: GPT-5.5, reasoning extra high.

Цель: add a public/live page probe so release claims are checked against what itch actually serves.

Критично: local build can be correct while hosted page remains old due to upload/cache/editor state.

Ownership: `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`, `itch_page_pack/probe_itch_editor.js`, `itch_page_pack/upload_manifest.json`.

Читать: `itch_page_pack/ITCH_EDITOR_RUNBOOK.md`, `mobile.md Itch.io Package`.

Deliverables:
- logged-out/public GET probe instructions or script;
- assert title/copy/key image/version markers;
- runbook separates editor preview from public page verification.

Проверки: script dry-run where URL configured; docs command examples.

Параллельные ограничения: do not require credentials in normal test path.
