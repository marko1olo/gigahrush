# MONSTER_35_MATKA_AUDIT Log

Completed MATKA audit for the existing spawner boss.

Changed:
- `src/entities/matka.ts`: added local `counterplay` and `lootHint` so MATKA teaches the intended room decision through the monster definition.

Read-only audit:
- `src/systems/ai/monster.ts`: MATKA reproduction stays unchanged. Current behavior uses a 60 second timer and `MATKA_MAX_CHILDREN = 100` checked against live nearby monsters in radius 20.
- `src/data/monster_ecology.ts`: ecology already describes MATKA as rare, deep-floor, late-samosbor, spawner boss content with matching rumor hooks and rare drops.
- `src/data/monster_variants.ts`: `choir_matka` remains a Hell-only swarm variant.
- `src/gen/maintenance/mancobus_room.ts`: reviewed as neighboring boss-room pattern; no MATKA changes needed there.

Cap/readability note:
- The existing cap is safe against infinite spawner growth, but 100 nearby children can still reduce encounter readability if a player stalls in a compact room. The audit contract forbids changing reproduction code here, so this remains a recorded concern rather than a code change.

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
