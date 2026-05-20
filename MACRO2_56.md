# MACRO2_56: Maintenance Route Grouping

Модель: GPT-5.5, reasoning extra high.

Цель: 45 Maintenance manifest entries become legible industrial routes: pressure, water, lift, slime, production, mail.

Критично: Maintenance has the highest density; without grouping, player sees names instead of expedition plans.

Ownership: `src/gen/maintenance/content_manifest.ts`, `src/systems/route_cues.ts`, `src/data/rumors.ts`, `src/render/map_ui.ts`.

Читать: `README.md Maintenance`, `desdoc.md Maintenance grouping`, `src/gen/maintenance/**`.

Deliverables:
- route group tags/labels for existing POI;
- route cues and rumors point along groups;
- debug summary lists active group leads on Maintenance.

Проверки: `npm run content:audit`, `npm run typecheck`, manual Maintenance route audit.

Параллельные ограничения: no mass generator rewrite; metadata/cues first.
