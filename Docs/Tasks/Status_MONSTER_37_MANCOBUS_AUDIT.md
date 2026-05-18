# MONSTER_37_MANCOBUS_AUDIT Status

Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_37_MANCOBUS_AUDIT">` from `Monster_37.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/mancobus.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/gen/maintenance/mancobus_room.ts`, and `src/systems/ai/monster.ts`.
- Baseline `npm run typecheck`: passed.

## Audit Notes

- MANCOBUS is already a rare Maintenance/Hell controller boss in shared ecology with low spawn weight, late samosbor gating, command-rumor hook, and energy/voice rare drops.
- Generic ranged AI gives MANCOBUS a slow projectile attack using `projSpeed: 6`, `attackRate: 3.0`, and line-of-sight pressure inside range 15. No special boss AI hook exists.
- The Maintenance encounter spawns one MANCOBUS plus 10 mixed guards in `Логово Манкобуса`, which supports the intended "clear guards first" contract.
- Placement concern: the current 11x11 room is mostly open. Corner play is available through the doorway and approach corridors, but a future generator owner could add internal concrete cover or a bent entrance if MANCOBUS needs stronger in-room sector breaking.

## Changes

- Updated `src/entities/mancobus.ts` only.
- Added local `floors` metadata for `MAINTENANCE` and `HELL`.
- Added local `counterplay` text that teaches clearing guards, avoiding direct sector, and attacking from corners between volleys.
- Added local `lootHint` text aligned with existing energy-cell and bottled-voice drops.
- Preserved HP, speed, damage, attack rate, projectile speed, shared AI, ecology, and generator placement.

## Shared Diff Requests

None. Generator and AI concerns are recorded only.

## Validation

- Baseline command: `npm run typecheck`
- Baseline result: exit 0
- Post-change command: `npm run typecheck`
- Post-change result: exit 0
