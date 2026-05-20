# MACRO2_7: Entity Index Rebuild Contract

Модель: GPT-5.5, reasoning extra high.

Цель: сделать `systems/entity_index.ts` единым runtime broadphase contract, без лишних rebuild-волн в одном кадре.

Критично: high-density floors уже генерируют тысячи entities; индекс есть, но rebuild вызывается из `main.ts` и `updateAI`, что делает стоимость неочевидной.

Ownership: `src/systems/entity_index.ts`, `src/main.ts`, `src/systems/ai/index.ts`, `tests/entity-index.test.ts`.

Читать: `scaling.md`, `src/systems/entity_index.ts`, `src/main.ts`, `src/systems/ai/index.ts`.

Deliverables:
- ровно один planned rebuild перед update/simulation phase и documented exceptions after spawn cleanup;
- debug metric: index version, entity count, bucket stats;
- no gameplay behavior drift at current population.

Проверки: `npm run test:unit`, `SMOKE_SCENARIO=stress SMOKE_PERF_FRAMES=180 npm run smoke`.

Параллельные ограничения: не переписывать ECS; flat `entities` остается source of truth.
