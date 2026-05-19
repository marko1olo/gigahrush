# MONSTER_30_ZOMBIE_AUDIT Status

Status: complete

## Preflight

- Extracted `MONSTER_30_ZOMBIE_AUDIT` from `Monster_30.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/zombie.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/gen/living/hospital_quarantine.ts`, and `src/systems/ai/monster.ts`.
- Baseline `npm run typecheck`: passed.

## Audit Notes

- Current Мертвяк stats already fit the ordinary-alone role: moderate HP, slow speed, low damage, no special fast-swarm or boss behavior.
- Shared ecology already places ZOMBIE on non-VOID floors, biases it toward living/kitchen/common/office rooms, and gives it `office_zombie` and `wild_zombie` variants.
- Existing quarantine content already exposes a reachable ZOMBIE encounter and KILL quest in the Living hospital block.
- Desired future encounter tuning outside this audit: quarantine and crowd rooms can place Мертвяк so the door/crowd decision is sharper, but that belongs to floor content, not `src/entities/zombie.ts`.

## Changes

- Updated `src/entities/zombie.ts` with local `floors`, `counterplay`, and `lootHint` metadata.
- Kept HP, speed, damage, attack rate, AI, variants, ecology, and generation logic unchanged.
- Sharpened the sprite toward a former resident: tattered domestic clothes, faded undershirt, key-on-string detail, mismatched footwear.

## Validation

- Final `npm run typecheck`: passed.
- `npm run check`: not run; this audit changed local entity metadata/sprite and docs only.
- Note: unrelated untracked content modules caused transient typecheck failures during validation; only no-op TypeScript hygiene was needed there.
