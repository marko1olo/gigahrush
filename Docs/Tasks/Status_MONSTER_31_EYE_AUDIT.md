# MONSTER_31_EYE_AUDIT

Status: completed

## Scope

- Owned source touched: `src/entities/eye.ts`.
- Shared files were read only: `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/render/sprite_index.ts`.

## Audit

- `EYE` remains `isRanged: true`.
- Projectile speed stays `8`; current speed is dodgeable but still pressures open corridors.
- Attack rate stays `2.5`; the generic ranged AI already idles during cooldown, giving a close-after-shot window.
- Local `MonsterDef` metadata now repeats the shipped ecology role: break line of fire, then close after the shot.
- Bolt sprite was widened from a tiny dot into a green-yellow halo/tracer so damage is easier to read without changing projectile damage or broad combat behavior.

## Broad Feedback Needs

- Generic ranged monsters still do not perform a local line-of-sight gate before firing; projectiles collide later, but the windup/fire decision can feel like wall pressure. This belongs in a shared monster AI/projectile feedback pass, not this narrow EYE file.
- Impact feedback for hostile projectiles is still renderer/system owned and should remain outside this audit.

## Validation

- Baseline `npm run typecheck`: passed before edits.
- Final `npm run typecheck`: passed after edits.
