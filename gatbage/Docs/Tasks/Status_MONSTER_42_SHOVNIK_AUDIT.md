# MONSTER_42_SHOVNIK_AUDIT

Status: complete

Preflight:
- Extracted `MONSTER_42_SHOVNIK_AUDIT` from `Monster_42.md`.
- Read required docs and source listed in the prompt.
- Confirmed current AI: `SHOVNIK` moves at `1.18` near adjacent walls and `0.92` away from them; melee damage is `1.2` near adjacent walls and baseline elsewhere.
- Confirmed `src/data/monster_ecology.ts` already maps SHOVNIK to civil floors, seam counterplay, hermetic loot, and rare `hermo_gasket`/`sealant_tube` drops.

Planned scope:
- Keep AI, borer, ecology, and shared registries unchanged.
- Sharpen only local `src/entities/shovnik.ts` `counterplay` and `lootHint` text.

Implementation:
- Updated SHOVNIK local counterplay to explicitly teach pulling it into the room center.
- Updated SHOVNIK local loot hint toward hermetic/seam materials already used by ecology drops.

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
