# Addmonster 13: Олгой-Хорхой

## Source

- https://samosbor.shoutwiki.com/wiki/Олгой-Хорхой

## Current Coverage

`TUBE_EEL` is a water/pipe ambusher; Олгой-Хорхой is a large meat-hungry worm with blood/meat feeding history and collector/pipe horror. It can share some water/pipe code but should be slower, larger, and more decisive.

## Gameplay Role

Collector worm encounter around meat caches, blood stores, and corpse disposal. It creates route pressure: feed it, distract it, or risk a heavy ambush.

## Visual And Sprite Plan

- New sprite file: `src/entities/olgoy.ts`.
- Silhouette: thick pale worm front, circular mouth, small dark sensory dots, wet segmented body disappearing downward.
- Palette: dirty white/pink, brown-red mouth, blue-gray slime shine.
- Procedural generation:
  - Draw upright emerging worm segment as large oval/column.
  - Mouth ring with teeth/dark center.
  - Segment bands and wet highlight.
  - Size classes: juvenile, full collector worm.
- Should not look like `TUBE_EEL`: no fish head, much thicker and paler.

## AI Plan

- New `MonsterKind.OLGOY`.
- `meatWorm` AI flag:
  - Detects raw meat, corpses, heavy bleeding, and player/NPC within radius.
  - Burrow/ambush from water, pipe, or abyss-adjacent cells.
  - Slow on open dry floor, very dangerous near pipe mouths.
- Can be distracted by dropping raw meat or corpse bait.
- Attack: heavy bite, short pull toward pipe if close.

## Generation And Reachability

- Maintenance collectors, meat caches, flooded labs, Hell meat rooms.
- Rare procedural floor with `water`, `mushroom`, or `samosbor_seed` tags.
- Add an authored room later: illegal blood fridge or corpse chute.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/olgoy.ts`.
- `src/systems/ai/monster.ts`: meat detection and pipe ambush.
- Reuse `monster_bait.ts` for raw meat attraction.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `olgoy_burrowed`, `olgoy_fed`, `olgoy_dragged_target`.
- Tests: bait priority and dry-floor slowdown.

## Counterplay

- Fight away from pipes/water.
- Drop meat to redirect.
- Fire or explosives force it to burrow.
- Do not carry raw meat through collectors without plan.

## Done

- Bait loop uses existing item/drop systems.
- Ambush is tied to local pipe/water cells only.
- Has at least one reachable Maintenance spawn.

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
