# MACRO2_65: UI Text Overflow And Russian Copy Fit

Модель: GPT-5.5, reasoning extra high.

Цель: all canvas UI text fits or scrolls intentionally across HUD, menus, trade, containers, map, quests and Net terminal.

Критично: Russian strings are long; clipped UI turns dense systems into unusable panels.

Ownership: `src/render/ui_text.ts`, `src/render/ui_layout.ts`, `src/render/*_ui.ts`, `tests/ui-text.test.ts`.

Читать: `src/render/ui_text.ts`, `tests/ui-text.test.ts`, all UI panel renderers.

Deliverables:
- common fit/wrap helpers used by high-risk panels;
- no ellipsis that hides critical item/action names where scrolling is better;
- tests for long Russian words/phrases.

Проверки: `npm run test:unit`, `npm run smoke`.

Параллельные ограничения: do not shrink fonts with viewport width; use layout constraints.
