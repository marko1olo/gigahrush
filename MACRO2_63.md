# MACRO2_63: Unified Map Marker Language

Модель: GPT-5.5, reasoning extra high.

Цель: map/minimap markers use one scarce visual language for plot, assignment, anomaly, shelter, return and danger.

Критично: adding more pips without hierarchy makes the dense world less readable.

Ownership: `src/render/map_ui.ts`, `src/render/ui_text.ts`, `tests/ui-layout.test.ts`.

Читать: `README.md Rendering And UI`, `desdoc.md map debt`, `src/render/map_ui.ts`.

Deliverables:
- marker priority and legend rules;
- route target and return path visually distinct;
- dense crowd compression avoids unreadable marker noise.

Проверки: `npm run test:unit`, `npm run smoke`, manual full-map on Kvartiry/Hell.

Параллельные ограничения: no new DOM or external icon library.
