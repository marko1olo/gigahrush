# MONSTER_33_SHADOW_AUDIT

Status: complete  
Date: 2026-05-18  
Owner scope: `src/entities/shadow.ts`, this status file, final audit log.

## Preflight

- Extracted `MONSTER_33_SHADOW_AUDIT` from `Monster_33.md`.
- Read required docs: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `src/entities/shadow.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
- Baseline `npm run typecheck`: pass.

## Audit

- `SHADOW` / Теневик already had a clear ecology identity in `src/data/monster_ecology.ts`: ambush, dark corners, move after contact, rare `strange_clot`.
- Local `DEF` lacked the newer `counterplay`, `lootHint`, and `floors` fields used by several polished monster files.
- The sprite was almost pure black with very small eyes, so its ambush role risked reading as invisible rather than fair.

## Changes

- Added local `floors`, `counterplay`, and `lootHint` to `src/entities/shadow.ts`.
- Kept stats unchanged to preserve the existing ambush balance and avoid unowned AI/system edits.
- Sharpened the sprite with a faint violet afterimage, brighter eye pixels, shoulder breaks, and arm-edge cues while keeping the black silhouette.

## Blocker / Deferred

- True darkness, light, and open-space behavior would need a broad shared hook in AI/render/light data. Per prompt, that was recorded instead of editing shared systems.

## Validation

- Post-change `npm run typecheck`: pass.
