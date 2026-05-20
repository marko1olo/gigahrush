# MACRO2_9: Needs, Memory And Rumor Cohorts

Модель: GPT-5.5, reasoning extra high.

Цель: перевести non-player needs/memory/rumor updates на bounded cohorts for high-density floors.

Критично: `systems/needs.ts` проходит по all entities; это дешево на 1k, но дорого на 10k и не нужно для дальних жильцов.

Ownership: `src/systems/needs.ts`, `src/systems/npc_memory.ts`, `src/systems/rumor.ts`, `tests/context-lines.test.ts`.

Читать: `README.md`, `scaling.md`, `src/systems/needs.ts`, `src/systems/npc_memory.ts`, `src/systems/events.ts`.

Deliverables:
- hot NPC exact needs; cold residents slow/restored by room/occupation cadence;
- rumors generated from bounded event buffers, not full actor scans;
- debug summary for skipped/cohort-updated actors.

Проверки: `npm run test:unit`, stress smoke, focused needs regression.

Параллельные ограничения: player needs stay exact and unchanged.
