# MACRO2_53: Vertical Route UX

Модель: GPT-5.5, reasoning extra high.

Цель: player understands lift direction, z, route id, danger, anomaly and return path before and after travel.

Критично: the vertical route is huge; without intent, lifts feel like random teleporters.

Ownership: `src/render/map_ui.ts`, `src/render/quest_ui.ts`, `src/main.ts` lift prompt text, `src/systems/procedural_floors.ts`.

Читать: `desdoc.md P1.2`, `README.md Floors`, `src/data/design_floors.ts`.

Deliverables:
- lift prompt distinguishes story anchor, design floor, procedural expedition, numbered anomaly;
- arrival log gives immediate lead and return hint;
- map/full map shows z/route/danger consistently.

Проверки: `npm run typecheck`, `npm run test:unit`, manual route traversal.

Параллельные ограничения: reuse existing map/quest/log UI; no new screen.
