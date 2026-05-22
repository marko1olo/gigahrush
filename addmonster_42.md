# Addmonster 42: Бетоноед

## Source

- Former registry entry: `src/data/monster_variants.ts` id `betonoed`.
- Existing authored usage: `src/gen/maintenance/betonoed_shortcut.ts`.
- External lore source: https://neosamosbor.fandom.com/ru/wiki/Бетоноеды

## Hard Rule

Standalone monster package only. This is the clearest failure case of the old approach: Бетонник and Бетоноед must be separate monsters even if lore relates them.

## Gameplay Role

Weak-wall breacher and shortcut threat. It gives the player a concrete decision around noise, sealing, fire, and route greed.

Player decision: exploit the shortcut, seal the weak wall, lure it away with noise, burn it, or abandon the room.

## Sprite Plan

- New sprite module: `src/entities/betonoed.ts`.
- Silhouette: squat concrete-eating body with oversized grinding mouth and chalk-dust forearms.
- Palette: pale concrete dust, dark wet mouth, exposed aggregate speckles, red gum line.
- Procedural generation:
  - Draw a low bulky torso with a circular grinder-mouth.
  - Add pebble/aggregate pixels in the skin.
  - Add powder plume pixels around hands and jaw.
  - Keep it visually distinct from `BETONNIK`: less upright, more mouth/tool-shaped.
- Readability mark: weak-wall dust line appears before it breaks through.

## AI Plan

- New `MonsterKind.BETONOED`.
- Medium HP, low-to-medium speed, strong wall interaction, moderate melee.
- Special rule: `weakWallBreach`.
  - Can breach only authored weak-wall cells from its content module.
  - Noise can lure it toward a wall side; sealant/block-kit can deny breach.
  - Fire or sustained damage interrupts chewing.
- No arbitrary digging and no generic wall-carving AI.

## Generation And Reachability

- Convert `betonoed_shortcut.ts` to spawn `MonsterKind.BETONOED` directly.
- Keep general `spawnWeight: 0` until ordinary ecology is intentionally designed; authored/debug reachability is enough.
- Add normal monster rumor ids for weak-wall cues.
- Map editor/debug should list it as its own monster.

## Counterplay

- Listen for wall chewing and dust.
- Use noise to redirect.
- Use sealant/block-kit/fire if available.
- Do not assume a бетонник stat block.

## Done

- `world_log` and events key off `monsterKind` or `system: betonoed_shortcut`, never `monsterVariantId`.
- Бетоноед has its own sprite, stats, ecology/debug entry, and shortcut interaction.
- Old `betonoed` registry data is removed.

## Repeat-Pass Instructions

This file may be run after one or more earlier addmonster workers already touched the tree. Treat existing work for this monster as partial implementation to audit and finish, not as a reason to create a second package.

- First search the current tree for the planned `MonsterKind`, sprite module name, Russian display name, and former variant id or source name when this file lists one.
- If the monster already exists, keep its established ids and file names unless they are clearly broken; complete missing `Done` items instead of replacing the implementation.
- Repair reachability/debug spawning, ecology, rumors, events/log output, bounded AI behavior, and focused tests as needed.
- If `addmonster_43.md` has already removed `monsterVariantId` and `src/data/monster_variants.ts`, do not re-add them. Convert leftover references to direct `MonsterKind`, encounter tags, or authored module state.
- Preserve other addmonster additions in shared files. Resolve duplicates by keeping one canonical entry for this monster and leaving unrelated entries alone.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new or existing `MonsterKind`, reachability/debug path, tests run or skipped, whether this was fresh work or repeat completion, and conflicts/TODOs.
