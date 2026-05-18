# AG106 BetoNoed Final Report

Date: 2026-05-18

Implemented the BetoNoed MVP as a forced `BETONNIK` variant in a bounded Maintenance set-piece.

Files changed:
- `src/gen/maintenance/betonoed_shortcut.ts`
- `src/gen/maintenance/content_manifest.ts`
- `src/data/monster_variants.ts`
- `src/data/monster_ecology.ts`
- `src/systems/world_log.ts`
- `src/main.ts`
- `Docs/Tasks/Status_AG106_BETONOED.md`

Gameplay:
- The encounter owns one weak wall cell between a noisy storage room and a short route room.
- BetoNoed can breach that cell once, opening a shortcut and creating an immediate monster threat.
- Counterplay is explicit and bounded: noise bait speeds the breach, sealant prevents/closes it, construction can close the opened passage, flame drives the creature off, and leaving the area cancels a proximity breach.
- Terrain mutation is capped to the encounter weak cell; no general wall-digging system was added.

Events:
- Wall breached: `door_opened` with `betonoed`, `shortcut`, `wall_breached`.
- Passage sealed: `door_sealed` with `betonoed`, `shortcut`, `sealed`.
- Creature driven off: `death_seen` with `betonoed`, `driven_off`.
- Shortcut used: `door_opened` with `betonoed`, `shortcut_used`.
- Creature killed: existing `player_kill_monster` carries `monsterVariantId: betonoed`.

Validation:
- `npm run typecheck`: unavailable, missing npm script.
- `npm run check`: unavailable, missing npm script.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- Raw Node test runner was attempted but cannot resolve the repo's extensionless TypeScript imports without a project-specific loader.
