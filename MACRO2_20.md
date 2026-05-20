# MACRO2_20: Monster Variant Cue Pack

Модель: GPT-5.5, reasoning extra high.

Цель: common variants like wet, silent, lamp, pipe, garbage, black-slime and betonoed are visible/audible before they punish the player.

Критично: variants are cheap content only if player can infer rule changes.

Ownership: `src/data/monster_variants.ts`, `src/entities/procedural_visuals.ts`, `src/render/sprites.ts`, `src/data/rumors.ts`, variant tests.

Читать: `src/data/monster_variants.ts`, `src/entities/monster.ts`, `src/render/sprites.ts`.

Deliverables:
- visual tint/mark/name/bark cue for top 10 variants;
- variant rumors or death details mention tactical difference;
- spawn application remains data-driven.

Проверки: `npm run test:unit`, `npm run content:audit`, debug spawn variant pack.

Параллельные ограничения: avoid new sprite atlas ranges unless existing procedural coloring cannot express it.
