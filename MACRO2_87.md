# MACRO2_87: Maintenance Industrial Expedition Spine

Модель: GPT-5.5, reasoning extra high.

Цель: Maintenance has a clear industrial expedition spine across pressure, water, slime, lift, production and pneumomail.

Критично: Maintenance is content-rich but can feel like 45 unrelated doors.

Ownership: `src/gen/maintenance/content_manifest.ts`, selected local POI metadata, `src/systems/route_cues.ts`, `src/data/rumors.ts`.

Читать: `README.md Maintenance`, `Docs/ScenarioWriters/23_factory_workers.md`, `Docs/ScenarioWriters/24_maintenance_locksmiths.md`.

Deliverables:
- route groups with lead, risk, decision, reward;
- map/log/cue language for each group;
- at least one smoke/debug setup for industrial route.

Проверки: `npm run content:audit`, `npm run typecheck`, manual Maintenance route.

Параллельные ограничения: metadata/cues first, not 45-file rewrite.
