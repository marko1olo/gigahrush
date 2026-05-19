# MONSTER_37_MANCOBUS_AUDIT Log

Completed scoped MANCOBUS audit for the existing controller boss.

Changed:
- `src/entities/mancobus.ts`: added local `floors`, `counterplay`, and `lootHint` so the monster definition itself reads as a Maintenance/Hell boss-controller encounter before runtime ecology is consulted.

Read-only audit:
- `src/data/monster_ecology.ts`: already defines MANCOBUS as rare Maintenance/Hell content with guard/corner counterplay, command-rumor hook, and energy/voice rare drops.
- `src/gen/maintenance/mancobus_room.ts`: already creates a reachable boss room with one MANCOBUS and 10 guard monsters. No generator changes were made under this prompt.
- `src/systems/ai/monster.ts`: MANCOBUS uses the generic ranged path. The projectile cadence and speed already favor line-of-sight breaks over standing in the direct sector.

Placement concern:
- The current boss room is an 11x11 mostly open room. This preserves a simple readable arena and strong guard pressure, but internal corner play is limited. If a generator owner is assigned later, consider a bent entrance, column pair, or concrete cover cells without changing the boss identity.

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
