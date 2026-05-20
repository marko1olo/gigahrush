# MACRO2_80: NII Slime Sample Route

Модель: GPT-5.5, reasoning extra high.

Цель: make НИИ Слизи a complete sample loop: lead -> containment -> choice -> reward/consequence.

Критично: user explicitly named НИИ слизи; current slime content needs readable gameplay, not just sample ids.

Ownership: `src/data/slime_defs.ts`, `src/gen/maintenance/slime_sample_post.ts`, `src/gen/living/scientist_escort_sample.ts`, `src/data/contracts.ts`, `src/data/rumors.ts`.

Читать: `Docs/ScenarioWriters/15_nii_slime_lab.md`, `README.md slime/maintenance`, `src/data/slime_defs.ts`.

Deliverables:
- each slime color has gameplay role in text and route;
- sealed/unsealed sample risks are visible;
- choices: deliver to NII, sell, burn, hide, report.

Проверки: `npm run typecheck`, `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no universal mutation framework; use existing defs/events/contracts.
