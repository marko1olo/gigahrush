# MACRO2_18: Ranged Enemy Telegraph Pass

Модель: GPT-5.5, reasoning extra high.

Цель: Eye, Paragraph, Idol, Robot and ranged NPCs have readable windup, line-of-fire and post-shot answer.

Критично: corridor shooter gameplay needs fair ranged threats; invisible instant shots feel like bugs.

Ownership: `src/systems/ai/monster.ts`, `src/systems/ai/combat.ts`, `src/render/hud_fx.ts`, `src/data/monster_ecology.ts`, focused monster tests.

Читать: `src/entities/eye.ts`, `src/entities/paragraph.ts`, `src/entities/idol.ts`, `src/systems/ai/monster.ts`.

Deliverables:
- windup event/log/HUD cue for dangerous ranged attacks;
- line-of-sight uses toroidal math and geometry;
- counterplay: close after shot, break line, use cover, disable source where relevant.

Проверки: `npm run test:unit`, manual debug spawn ranged monsters.

Параллельные ограничения: do not globally nerf ranged enemies; make them readable.
