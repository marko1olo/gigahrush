# AG106 BetoNoed Status

Prompt: `AGENT_106_BETONOED_MONSTER_MVP`

Preflight:
- Read `README.md`, `architecture.md`, and `desdoc.md` section 16.6.
- Read `src/entities/monster.ts`, `src/entities/betonnik.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/content_manifest.ts`, and `src/gen/procedural_floor.ts`.
- Baseline `npm run typecheck`: failed before changes because `package.json` has no `typecheck` script. Available scripts are `dev`, `build`, and `preview`.

Implementation status:
- Decision: implemented BetoNoed as a forced `BETONNIK` variant/set-piece, not a new `MonsterKind` or sprite.
- Added `src/gen/maintenance/betonoed_shortcut.ts`: a two-room Maintenance weak-wall shortcut with one owned mutable wall cell.
- Added clear counterplay: `bottled_voice` noise bait accelerates breach, `sealant_tube` seals the weak wall, `block_kit`/door construction can close the opened passage, flame projectiles drive the creature off, and avoidance cancels the pending breach.
- Published structured events through existing event types/tags:
  - `door_opened` + `wall_breached` for the concrete breach.
  - `door_sealed` for sealing or construction closure.
  - `death_seen` + `driven_off` for fire-driven retreat.
  - `door_opened` + `shortcut_used` for first player use of the shortcut.
- Added world-log text for BetoNoed breach, seal, driven-off, shortcut-used, and kill events.

Validation:
- Baseline `npm run typecheck`: failed before changes because `package.json` has no `typecheck` script.
- `npm run check`: failed because `package.json` has no `check` script.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.ts` and `node --experimental-specifier-resolution=node --test tests/*.test.ts`: blocked by extensionless TypeScript ESM imports such as `src/core/types`.
