# MACRO2_11: Projectile And Explosion Broadphase

Модель: GPT-5.5, reasoning extra high.

Цель: закрыть все projectile/AoE collision paths на spatial index and path-radius queries.

Критично: projectile per-entity collision is one of the fastest ways to make dense firefights unplayable.

Ownership: `src/main.ts` projectile section, `src/systems/entity_index.ts`, `tests/player-damage.test.ts`.

Читать: `src/main.ts`, `src/systems/entity_index.ts`, `src/systems/ai/combat.ts`, `scaling.md`.

Deliverables:
- projectiles query only relevant buckets along movement path;
- explosions use indexed radius and no all-entity fallback except debug assertions;
- regression for toroidal edge projectile hit.

Проверки: `npm run test:unit`, `SMOKE_SCENARIO=stress SMOKE_PERF_FRAMES=180 npm run smoke`.

Параллельные ограничения: do not change weapon damage/balance in this task.
