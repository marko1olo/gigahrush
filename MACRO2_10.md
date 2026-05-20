# MACRO2_10: Renderer And HUD Broadphase Audit

Модель: GPT-5.5, reasoning extra high.

Цель: убедиться, что `webgl`, HUD, minimap, crosshair и interaction hints не сканируют все 10k entities каждый frame.

Критично: visible sprite cap не спасает, если broadphase до culling остается O(total entities).

Ownership: `src/render/webgl.ts`, `src/render/hud.ts`, `src/render/map_ui.ts`, `src/systems/entity_index.ts`, `tests/ui-layout.test.ts`.

Читать: `scaling.md`, `src/render/webgl.ts`, `src/render/hud.ts`, `src/render/map_ui.ts`.

Deliverables:
- sprite collection через entity index radius/buckets;
- HUD interact/crosshair query bounded by radius;
- minimap crowd compression for dense floors.

Проверки: `npm run test:unit`, `npm run smoke`, stress smoke, mobile viewport screenshot/manual check.

Параллельные ограничения: render reads state only; no gameplay decisions in render.
