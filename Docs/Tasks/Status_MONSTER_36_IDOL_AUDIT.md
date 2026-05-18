# MONSTER_36_IDOL_AUDIT Status

Status: complete
Date: 2026-05-18

## Scope

- Prompt block extracted from `Monster_36.md` by id `MONSTER_36_IDOL_AUDIT`.
- Read required docs and source references.
- Kept writes inside the assigned IDOL/test/status/log scope.

## Findings

- `src/entities/idol.ts` already had `speed: 0`, `isRanged: true`, `projSpeed: 12`, and a PSI-bolt projectile slot.
- Generic monster AI already treats `def.speed === 0` as immobile: no wandering/pathfinding, ranged fire allowed at close range.
- Hell choir and Underhell authored encounters already place IDOL as a fixed signal/anchor threat.

## Changes

- Added local `floors`, `counterplay`, and `lootHint` to `IDOL` so the entity definition carries the static turret contract directly.
- Added `tests/monster_36_idol_audit.test.ts` to lock immobility, ranged role, floor list, and angle/rush counterplay wording.
- Sprite silhouette was not changed; the existing procedural spire already reads as a static monolith.

## Validation

- Baseline `npm run typecheck`: passed before edits.
- Final `npm run typecheck`: passed.
- Final `npm run test:unit`: passed, 70 tests.
