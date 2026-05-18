# MONSTER_35_MATKA_AUDIT Status

Status: done

Scope:
- Audited `src/entities/matka.ts` as the local MATKA definition.
- Reviewed shared ecology, variant, AI spawn cap, and maintenance boss-room context read-only.
- Updated only MATKA local `counterplay` and `lootHint`.

Findings:
- MATKA remains a rare spawner boss in ecology: `MAINTENANCE`, `HELL`, `VOID`; rare, low spawn weight, gated by later samosbor count.
- Shared AI keeps reproduction capped by `MATKA_MAX_CHILDREN = 100` within radius 20 and spawns only once per 60 seconds if the local cap is below the limit.
- The cap is acceptable for current safety because it prevents unbounded room growth, but it is still high for readability in small rooms. No spawner logic was changed under this audit.
- Player-facing decision is now explicit in the local definition: kill the core fast or clear children first; do not do both slowly.

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
