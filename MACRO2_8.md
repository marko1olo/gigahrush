# MACRO2_8: AI Hot/Warm/Cold LOD Scheduler

Модель: GPT-5.5, reasoning extra high.

Цель: подготовить AI к 5k-10k actors через distance/importance tiers без потери quest targets и bosses.

Критично: `KVARTIRY` и `HELL` уже используют high-density profiles; full AI каждый кадр не масштабируется.

Ownership: `src/systems/ai/index.ts`, `src/systems/ai/npc_fsm.ts`, `src/systems/ai/monster.ts`, `src/data/population_profiles.ts`, `tests/population-profiles.test.ts`.

Читать: `scaling.md`, `architecture.md`, `src/systems/entity_index.ts`, `src/systems/ai/**`.

Deliverables:
- hot bubble near player = current behavior;
- warm/cold cohorts update slower and never pathfind every frame;
- important override for plot NPCs, active attackers, bosses, projectiles, recently damaged.

Проверки: `npm run test:unit`, stress smoke on `KVARTIRY` and `HELL`, manual debug counters.

Параллельные ограничения: do not simplify combat rules; only scheduling/cadence changes.
