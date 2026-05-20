# MACRO2_4: Content Audit Expansion

Модель: GPT-5.5, reasoning extra high.

Цель: расширить `content:audit` до текущего масштаба проекта: population profiles, event tags, screen/scenario docs refs, README counters, direct refs in more AST shapes.

Критично: gate зеленый, но новые домены растут быстрее аудита; без него 100 агентов начнут добавлять dead data.

Ownership: `scripts/content-audit.mjs`, `tests/content-registry.test.ts`.

Читать: `README.md`, `architecture.md`, `scripts/content-audit.mjs`, `src/data/population_profiles.ts`, `src/systems/events.ts`.

Deliverables:
- audit population/profile counts и README count-table mismatch;
- validate event type/tag ids used by contracts/rumors/screens;
- detect exported generator modules that are never invoked by manifest runners.

Проверки: `npm run content:audit`, `npm run test:unit`, `npm run typecheck`.

Параллельные ограничения: не менять content ids ради аудита без отдельного gameplay reason.
