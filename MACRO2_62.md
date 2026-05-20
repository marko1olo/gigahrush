# MACRO2_62: Inventory Ergonomics And Survival Prep

Модель: GPT-5.5, reasoning extra high.

Цель: inventory makes expedition prep efficient: equip weapon/tool, see ammo/medicine/water, drop/use/sell without ambiguity.

Критично: survival loop starts with preparation; bad inventory hides the core decisions.

Ownership: `src/render/hud.ts`, `src/systems/inventory.ts`, `src/render/ui_layout.ts`, `tests/inventory-rpg.test.ts`, `tests/ui-layout.test.ts`.

Читать: `README.md Controls`, `src/systems/inventory.ts`, `src/render/hud.ts`.

Deliverables:
- clear selected item, equipped weapon/tool, stack count, use/drop affordance;
- prep categories visible enough for desktop/mobile;
- no text overflow at small canvas.

Проверки: `npm run test:unit`, `npm run smoke`, mobile manual viewport.

Параллельные ограничения: canvas UI only.
