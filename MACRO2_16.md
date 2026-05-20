# MACRO2_16: Monster Counterplay Matrix

Модель: GPT-5.5, reasoning extra high.

Цель: проверить 24 base monsters и 23 variants на cue -> rule -> counterplay -> rumor/death-log.

Критично: монстр должен менять тактику, а не быть другим HP/speed.

Ownership: `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/entities/*.ts`, `tests/monster_47_common_counterplay.test.ts`.

Читать: `README.md Monsters`, `desdoc.md P0.2`, `monsters.md`, `src/systems/ai/monster.ts`.

Deliverables:
- matrix file/section with each monster role, cue, counterplay, floor fit;
- missing common cues become data/text/sprite/audio tasks;
- tests assert non-empty concrete counterplay and rumor hooks.

Проверки: `npm run test:unit`, `npm run content:audit`, manual debug monster packs.

Параллельные ограничения: do not add MonsterKind for named POI-only threats.
