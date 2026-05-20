# MACRO2_61: ARPG Stat Effects Audit

Модель: GPT-5.5, reasoning extra high.

Цель: STR/AGI/INT visibly change expedition style without making horror irrelevant.

Критично: level-up should create next-run planning, not just hidden numbers.

Ownership: `src/systems/rpg.ts`, `src/render/stats_ui.ts`, `src/systems/inventory.ts`, `src/data/psi.ts`, `tests/inventory-rpg.test.ts`.

Читать: `desdoc.md P1 ARPG Progression`, `src/systems/rpg.ts`, `src/render/stats_ui.ts`.

Deliverables:
- STR: melee/carry/HP/heavy weapon clarity;
- AGI: movement/reload/steal or attack cadence clarity;
- INT: PSI/economy/docs/dialogue hooks where already supported.

Проверки: `npm run test:unit`, manual level/debug stat spend.

Параллельные ограничения: no perk tree until base stats are meaningful.
