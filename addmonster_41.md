# Addmonster 41: Помойный Рой

## Source

- Former registry entry: `src/data/monster_variants.ts` id `garbage_krysnozhka`.
- Lore-facing old name: `Помойная Крысоножка`.

## Hard Rule

Standalone monster package only. It can be related to крысоножки in lore, but mechanically it is its own swarm package.

## Gameplay Role

Food-attracted garbage swarm that surrounds instead of dueling. It makes containers, thrown bait, and route discipline matter.

Player decision: keep food sealed, throw bait away from yourself, or burn/ammo-clear a path through the swarm.

## Sprite Plan

- New sprite module: `src/entities/pomoynyy_roy.ts`.
- Silhouette: many tiny legged trash lumps forming one moving edge.
- Palette: plastic gray, dirty green, black legs, occasional food-yellow pixels.
- Procedural generation:
  - Draw 8 to 16 small bodies around a loose center.
  - Use seeded plastic bag shapes and thin black legs.
  - Add one larger core lump for selection/readability.
- Readability mark: swarm edge points toward exposed food.

## AI Plan

- New `MonsterKind.POMOYNY_ROY`.
- Low individual HP feel, medium aggregate HP, surround pressure.
- Special rule: `garbageSurround`.
  - Aggro radius grows when player carries exposed food/trash bait.
  - Swarm tries to occupy flank cells instead of all stacking forward.
  - Dropped bait redirects the swarm center for a limited time.

## Generation And Reachability

- Floor weights: `KVARTIRY`, `LIVING`, `MAINTENANCE`.
- Spawn near trash rooms, markets, kitchen waste, clogged service corners.
- Convert old garbage rumors to normal monster rumors.

## Counterplay

- Put food into containers.
- Throw bait away from the escape route.
- Use fire/area tools if available; otherwise cut a narrow exit.

## Done

- Swarm movement uses fixed slots/radius caps.
- Food attraction is item-tag driven.
- No `garbage_krysnozhka` id remains.

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
