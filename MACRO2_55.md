# MACRO2_55: Rumor-To-Place Chains

Модель: GPT-5.5, reasoning extra high.

Цель: top rumors point to concrete POI, room type, floor route, monster, resource or container action.

Критично: 492 rumors are valuable only if they help the player plan routes and risks.

Ownership: `src/data/rumors.ts`, `src/systems/rumor.ts`, `src/data/context_lines.ts`, `tests/context-lines.test.ts`.

Читать: `desdoc.md Rumor-to-place`, `src/data/rumors.ts`, `src/systems/events.ts`.

Deliverables:
- audit weakest vague rumors and add lead metadata/action;
- runtime event rumors retain floor/zone/room context;
- no lore-only rumor without gameplay surface in high-priority pools.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: do not bulk-add hundreds of lines; fix the most actionable pools.
