# MACRO2_19: Boss And Late-Game Fight Clarity

Модель: GPT-5.5, reasoning extra high.

Цель: Mancobus, Herald, Creator, Myasomer and Void rule threats have phase/cue/readable failure reasons.

Критично: late game must feel severe but fair; current scale can hide boss rules under effects.

Ownership: `src/entities/mancobus.ts`, `src/entities/herald.ts`, `src/entities/creator.ts`, `src/gen/hell/*`, `src/gen/void/*`, tests for boss modules.

Читать: `README.md Story Chain`, `src/gen/hell`, `src/gen/void`, `src/systems/damage.ts`.

Deliverables:
- each boss/rule threat has warning text and death/failure cause;
- reward/retreat route remains available where design allows;
- no boss relies only on HP inflation.

Проверки: `npm run test:unit`, debug teleport/manual boss route.

Параллельные ограничения: no new final cosmology docs; implement readable gameplay.
