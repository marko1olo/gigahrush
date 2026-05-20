# MACRO2_45: Design Floor Docs Factual Sync

Модель: GPT-5.5, reasoning extra high.

Цель: align `Docs/DesignFloors/*.md` with shipped route data: z anchors, route ids, implemented/future boundaries.

Критично: design floor docs are historical planning artifacts, but agents still read them before source.

Ownership: `Docs/DesignFloors/*.md`, `Docs/DesignFloors/INDEX.md`, `README.md` only for verified facts.

Читать: `README.md Authored Design Floors`, `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`.

Deliverables:
- route table sync for `roof=-44`, `pioneer_camp=-32`, `bank_floor=-22`, etc.;
- mark stale "planned" claims where implementation differs;
- no new promises in README.

Проверки: `npm run content:audit`, route table source/docs comparison.

Параллельные ограничения: no source code edits unless docs reveal a verified source bug.
