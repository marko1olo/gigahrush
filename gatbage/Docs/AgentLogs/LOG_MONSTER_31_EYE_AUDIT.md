# MONSTER_31_EYE_AUDIT

Final report:

- Read the assigned prompt block from `Monster_31.md`.
- Read required docs and sources: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, `src/entities/eye.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, and `src/render/sprite_index.ts`.
- Kept `Глаз` as the ranged corridor breaker: `isRanged`, `projSpeed`, damage, and `attackRate` are unchanged.
- Added local `MonsterDef` floor, counterplay, and loot hint metadata so the entity definition itself says to break line of fire and close after the shot.
- Reworked only the local EYE bolt generator into a brighter halo/tracer projectile cue.
- Recorded shared projectile feedback needs in status instead of changing shared AI/render files.

Validation:

- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
