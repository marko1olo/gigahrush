# MACRO2_46: Manifest Import Hardening

Модель: GPT-5.5, reasoning extra high.

Цель: content audit verifies manifest imports are actually invoked/registered exactly once.

Критично: side-effect import present is not enough if exported runner is orphaned or ordered incorrectly.

Ownership: `scripts/content-audit.mjs`, `src/gen/*/content_manifest.ts`, `tests/content-registry.test.ts`.

Читать: `architecture.md Import Contention Fix`, `scripts/content-audit.mjs`, all floor manifests.

Deliverables:
- detect uncalled exported generators/runners;
- detect duplicate manifest registration/import where safe;
- report owner file and line.

Проверки: `npm run content:audit`, `npm run test:unit`.

Параллельные ограничения: do not reorder gameplay content casually; report order-sensitive conflicts.
