# MACRO2_86: Kvartiry Social Crisis Route

Модель: GPT-5.5, reasoning extra high.

Цель: Kvartiry becomes a readable dense social crisis: ration, water, queue, riot, neighbor, denunciation.

Критично: 5k+ actors only matter if local social decisions are legible.

Ownership: `src/gen/kvartiry/*.ts`, `src/systems/faction_events.ts`, `src/render/map_ui.ts`, `tests/kvartiry_communal_kitchen_feud.test.ts`.

Читать: `README.md Kvartiry`, `Docs/ScenarioWriters/09_citizen_neighbors.md`, `Docs/ScenarioWriters/28_housewives_domkom.md`.

Deliverables:
- route audit through ration/water/medicine/false-neighbor crisis;
- crowd pressure visible without UI overload;
- outcome leaves rumor/event/zone or container trace.

Проверки: `npm run test:unit`, manual Kvartiry debug route.

Параллельные ограничения: do not raise population caps unless perf work is complete.
