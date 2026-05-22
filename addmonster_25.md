# Addmonster 25: Жорная Тварь

## Source

- Former registry entry: `src/data/monster_variants.ts` id `hungry_tvar`.
- Lore-facing old name: `Голодная Тварь`.

## Hard Rule

Standalone monster package only. It can belong to the тварь family in fiction, but its food-scent AI is its own package.

## Gameplay Role

Scent-driven lunging predator. It makes meat, blood, food, and bait inventory matter in moment-to-moment movement.

Player decision: keep food sealed, throw bait away from your route, or exploit its overcommit to open a door/run window.

## Sprite Plan

- New sprite module: `src/entities/zhornaya_tvar.ts`.
- Silhouette: stretched jaw, low shoulders, belly folded into dark hanging meat.
- Palette: dark flesh, greasy yellow highlights, concrete dust on claws.
- Procedural generation:
  - Seed a large jaw arc with uneven teeth.
  - Add dark wet streaks under the head and belly.
  - Draw sniffing tendrils as short broken lines near the mouth.
- Readability mark: jaw opens and belly contracts during scent lock.

## AI Plan

- New `MonsterKind.ZHORNAYA_TVAR`.
- Medium HP, high lunge damage, long cooldown after missed lunge.
- Special rule: `scentOvercommit`.
  - Tracks nearby dropped food/meat/blood tags before pure player pursuit.
  - Bait can redirect the next lunge if thrown outside the player cell path.
  - After lunging, it enters a punishable recovery.

## Generation And Reachability

- Floor weights: `HELL`, `LIVING`, rare `KVARTIRY`.
- Spawn near kitchens, meat rooms, corpse piles, feast/altar content.
- Add food-container interaction only through existing inventory/container hooks.

## Counterplay

- Put food in containers before entering suspect rooms.
- Throw bait past the creature, not at your feet.
- Punish the recovery after an overcommitted lunge.

## Done

- Scent rules are deterministic and bounded.
- Bait is a real route decision.
- No `hungry_tvar` id remains.

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
