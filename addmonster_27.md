# Addmonster 27: Дикий Мертвяк

## Source

- Former registry entry: `src/data/monster_variants.ts` id `wild_zombie`.
- Lore-facing old name: `Дикая Мертвячина`.

## Hard Rule

Standalone monster package only. It can be a dead human in lore, but code must not treat it as a prefixed `ZOMBIE`.

## Gameplay Role

Fragile crowd-runner that becomes dangerous in door jams and NPC clusters. Alone it is disposable; in a messy corridor it creates panic.

Player decision: clear a path before firing, retreat into open floor, or stagger it before it reaches the crowd.

## Sprite Plan

- New sprite module: `src/entities/dikiy_mertvyak.ts`.
- Silhouette: bent fast corpse with extended elbows and torn jaw.
- Palette: pale dead skin, dark clothing, bright scrape wounds at knees/hands.
- Procedural generation:
  - Draw a forward-lean sprint pose.
  - Add torn cloth trails and bloodless white knuckles.
  - Seed 2 to 4 wound scratches on limbs.
- Readability mark: feet blur in a short run-up frame.

## AI Plan

- New `MonsterKind.DIKIY_MERTVYAK`.
- Low HP, high speed, low armor, moderate damage.
- Special rule: `crowdShove`.
  - Gains shove momentum through narrow passages and nearby bodies.
  - If it collides with a blocked tile/NPC cluster, it causes a short crowd panic/stagger.
  - Early damage before the shove cancels momentum.

## Generation And Reachability

- Floor weights: `KVARTIRY`, `LIVING`.
- Spawn in queues, apartment halls, market crush, neighbor events.
- Keep pack sizes small to avoid turning it into a generic swarm.

## Counterplay

- Create open floor.
- Hit before it enters the crowd.
- Avoid door-frame fights.

## Done

- Crowd shove is capped and does not scan the whole population.
- Solo monster remains weak.
- No old `wild_zombie` id remains.

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
