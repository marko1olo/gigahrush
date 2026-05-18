# MONSTER_40_SPIRIT_AUDIT

Status: complete  
Date: 2026-05-18  
Owner scope: `src/entities/spirit.ts`, this status file, final audit log.

## Preflight

- Extracted `MONSTER_40_SPIRIT_AUDIT` from `Monster_40.md`.
- Read required docs: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `src/entities/spirit.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
- Baseline `npm run typecheck`: pass.

## Audit

- `SPIRIT` / Дух already has the correct broad behavior through existing phasing spawns and monster AI: when `e.phasing` is set, it moves directly through walls instead of relying on pathfinding.
- The ecology entry already communicates the right rule: doors and walls are not reliable; reposition before contact.
- Local `DEF` lacked the newer `floors`, `counterplay`, and `lootHint` fields used by polished monster definitions.
- Stats were already distinct from `SHADOW`: lower speed and slower attacks, but harder contact damage, matching a visible phasing threat rather than a darkness ambusher.

## Changes

- Added local `floors`, `counterplay`, and `lootHint` to `src/entities/spirit.ts`.
- Kept combat stats unchanged to preserve phasing balance and avoid unowned shared-system edits.
- Added a pale phase veil and raised skull edge opacity so the ghost remains transparent but readable before contact.

## Blocker / Deferred

- Phasing correctness depends on spawners continuing to set `phasing: kind === MonsterKind.SPIRIT`; current audited spawn paths already use that pattern. No shared AI or generator edit was needed under this prompt.

## Validation

- Post-change `npm run typecheck`: pass.
- `npm run smoke`: pass.
