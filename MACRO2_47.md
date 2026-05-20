# MACRO2_47: Per-POI Generation Metadata Registry

Модель: GPT-5.5, reasoning extra high.

Цель: each generated POI can report id, room ids, NPC ids, containers, decision hooks and debug label for automated audits.

Критично: at project scale, manual "is this content reachable?" checks do not scale.

Ownership: floor-local `content_manifest.ts` files, `src/gen/content_manifest_utils.ts`, new tests.

Читать: `architecture.md Content Module Contract`, `src/gen/content_manifest_utils.ts`, representative POI modules.

Deliverables:
- minimal metadata interface with optional fields;
- adapters for 2-3 floors first, not all content at once;
- reachability audit can consume metadata where present.

Проверки: `npm run typecheck`, `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no massive cross-floor mechanical churn in one patch.
