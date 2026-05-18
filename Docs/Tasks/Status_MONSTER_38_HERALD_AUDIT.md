# Status_MONSTER_38_HERALD_AUDIT

Status: complete
Date: 2026-05-18

Prompt: `MONSTER_38_HERALD_AUDIT`

## Preflight

- Extracted the `MONSTER_38_HERALD_AUDIT` block from `Monster_38.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source files:
  - `src/entities/herald.ts`
  - `src/entities/monster.ts`
  - `src/data/monster_ecology.ts`
  - `src/gen/hell/index.ts`
  - `src/systems/ai/monster.ts`
- Baseline `npm run typecheck`: passed.

## Audit Notes

- `Вестник` is already Hell-only in `MONSTER_ECOLOGY` and is placed by `spawnHeralds` in `src/gen/hell/index.ts`.
- Ranged behavior remains the generic projectile watcher path: high damage, clear punishment for open corridors, no new system hook.
- Existing ecology already frames counterplay around cover, open corridor danger, and listening too long.

## Changes

- Added local `floors`, `counterplay`, and `lootHint` to `src/entities/herald.ts`.
- Kept Herald as Hell-only rare watcher.
- Sharpened the sprite from a dead-tree silhouette into a Hell siren watcher: crown horns, vocal slits, eye-cables, and meat-root base.

## Validation

- Final `npm run typecheck`: passed.
