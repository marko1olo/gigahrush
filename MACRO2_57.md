# MACRO2_57: Container Ownership Consequences

Модель: GPT-5.5, reasoning extra high.

Цель: stealing from owned/faction containers produces witness, audit, reputation, rumor or delayed consequence when appropriate.

Критично: loot must be a choice: buy, steal, unlock, repair, report or walk away.

Ownership: `src/systems/containers.ts`, `src/render/container_ui.ts`, `src/systems/events.ts`, `tests/events-economy.test.ts`.

Читать: `desdoc.md P0.5`, `README.md Economy`, `src/systems/containers.ts`.

Deliverables:
- clear UI theft risk state;
- nearby witness and delayed owner/faction audit paths;
- events feed rumor/world log without spam.

Проверки: `npm run test:unit`, manual owned container theft.

Параллельные ограничения: do not make all looting punitive; use owner/faction/context.
