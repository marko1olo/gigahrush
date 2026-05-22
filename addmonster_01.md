# Addmonster 01: Собранный человек

## Source

- https://samosbors8878.fandom.com/ru/wiki/Собранный_человек
- https://samosbors8878.fandom.com/ru/wiki/Мутанты

## Current Coverage

No exact game monster. `ZOMBIE`, `NIGHTMARE`, `MATKA`, and generic mutant ecology cover adjacent horror, but none implements a single composite person made from several trapped people that grows from violence and can be isolated.

## Gameplay Role

Rare post-samosbor composite brute for production rooms, bunkers, and sealed shelters. It should be less common than `BETONNIK`, but more systemic than a one-off boss: a fight, lure, or isolation problem.

Player decision: burn it early, lure it into slime/isolation, or leave the sealed room alone and mark it for liquidators.

## Visual And Sprite Plan

- New sprite file: `src/entities/sobrannyy.ts`.
- Silhouette: oversized human torso, too many shoulders, several head bumps, one dragging fused coat hem.
- Palette: burned skin black/brown, gray cloth patches, dull red seams, occasional white bone pixels.
- Procedural generation:
  - Draw a large lumpy vertical body with 3 to 5 shoulder/head lobes using seeded ellipses.
  - Add asymmetric arms: one normal heavy arm, one fused multi-forearm hook.
  - Add stitched clothing bands as dark rectangles that look like one garment made from many clothes.
  - Add damaged visual states from entity seed/local damage flags: charred, wet, office-cloth.
- Readability mark: pale seams widen as it enrages.

## AI Plan

- New `MonsterKind.SOBRANNYY`.
- Base stats: high HP, slow-to-medium speed, heavy melee damage, low attack frequency.
- Special rule: `meatGrowth`.
  - When it kills or is hit repeatedly within a short window, it gains a bounded temporary size/damage buff.
  - Cap growth to avoid runaway. Suggested cap: 3 stacks, each 20 seconds.
- It ignores small damage while idle for a short opening phase, then wakes if damaged, approached, or a door/container in its room is opened.
- It loses interest when target crosses a toxic slime patch or exits through a sealed/hermetic door. This matches source behavior where slime distracted it.
- It can damage weak doors but should not carve arbitrary walls.

## Generation And Reachability

- Add ecology entry with low weight on `LIVING`, `MAINTENANCE`, `HELL`, and procedural floors with `samosbor_seed`, `production`, or `shelter` tags.
- Add one authored Maintenance or Living POI later: sealed worker bunker with a container, survivor note, and optional report outcome.
- Debug path: map editor monster catalog plus a debug spawn command.

## Systems And Files

- `src/core/types.ts`: add enum member.
- `src/entities/monster.ts`: import/register def and sprite.
- `src/data/monster_ecology.ts`: role, floors, rare spawn, rumor ids.
- `src/data/rumors.ts`: warning rumor about too many people in one shelter.
- `src/systems/ai/monster.ts`: implement bounded `meatGrowth`, wake state, and slime disinterest.
- `src/systems/events.ts` / `world_log.ts`: events for `composite_woke`, `composite_growth`, `composite_isolated`.
- `tests/monster_00_base_registry_audit.test.ts` plus one focused AI test.

## Counterplay

- Do not shoot it awake without an exit.
- Fire and sustained shotgun stagger slow growth.
- Toxic slime or a hermetic threshold breaks pursuit.
- Report/isolate can be a valid non-kill outcome.

## Done

- Spawned through ecology or authored POI.
- Sprite reads as composite human at 64x64.
- Growth is capped, evented, and test-covered.
- Player has at least two non-DPS answers.

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
