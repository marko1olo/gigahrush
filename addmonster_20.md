# Addmonster 20: Трескотник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `cracked_sborka`.
- Lore-facing old name: `Треснутая Сборка`.

## Hard Rule

Standalone monster package only. It may be described in lore as related to сборки, but implementation must not use `monsterVariantId`, prefix stacking, `baseKind`, shared modifier flags, or inherited stats.

## Gameplay Role

Fast brittle crack-creature for living floors and квартальные rooms. It turns a quiet corridor into a short timing test: fire early and it shatters, hesitate and it reaches melee.

Player decision: spend cheap ammo immediately, hold a door corner for a guaranteed stagger, or kite it through debris and risk the rush.

## Sprite Plan

- New sprite module: `src/entities/treskotnik.ts`.
- Silhouette: narrow hunched torso made of concrete plates split by glowing red cracks.
- Palette: cold concrete gray, dark dust seams, thin saturated red fracture lines.
- Procedural generation:
  - Seed 5 to 9 jagged crack polylines across the body.
  - Make one shoulder and one shin look already broken off.
  - Add tiny red dust pixels that flare during windup.
- Readability mark: cracks pulse brighter for 0.35 seconds before the sprint.

## AI Plan

- New `MonsterKind.TRESKOTNIK`.
- Low HP, high acceleration, short windup, high contact burst.
- Special rule: `fractureSprint`.
  - It pauses and crackles before a straight sprint.
  - Any hit during windup cancels the sprint and applies a long stagger.
  - If it reaches the player, it deals damage and loses part of its own HP.
- No generic modifier multipliers. All stats live in its own monster definition.

## Generation And Reachability

- Floor weights: `LIVING`, `KVARTIRY`, rare `HELL`.
- Prefer long but cluttered corridors and rooms with brittle wall marks.
- Add rumors as normal monster rumors, not old modifier rumor ids.
- Debug path: map editor catalog and debug spawn by `MonsterKind.TRESKOTNIK`.

## Counterplay

- Shoot during the red crack pulse.
- Break line behind a corner before windup completes.
- Let it hit a closed door/debris if ammo is scarce.

## Done

- Has own monster kind, sprite, ecology, rumors, and spawn weights.
- No code path reads the old `cracked_sborka` id.
- Windup cancel is evented and test-covered.

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
