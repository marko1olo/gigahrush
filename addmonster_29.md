# Addmonster 29: Чернослиз

## Source

- Former registry entry: `src/data/monster_variants.ts` id `black_slime_eye`.
- Existing authored usage: `src/gen/maintenance/black_slime_eyes.ts`.

## Hard Rule

Standalone monster package only. Existing black-slime-eye encounters must spawn this kind directly, not set `monsterVariantId`.

## Gameplay Role

Dark-water ambush turret for maintenance collectors. It gets the first shot when the player face-checks black water.

Player decision: probe water with light/noise/shot, take a dry route, or accept the ambush to save resources.

## Sprite Plan

- New sprite module: `src/entities/chernosliz.ts`.
- Silhouette: half-submerged eye-bulb floating in black slime, with one vertical slit.
- Palette: near-black body, oily violet highlights, toxic green slit.
- Procedural generation:
  - Draw a round eye mostly hidden by a black surface line.
  - Add irregular slime bubbles and ripple arcs.
  - Use a green slit that opens only when aggroed.
- Readability mark: water ripples against current before the first shot.

## AI Plan

- New `MonsterKind.CHERNOSLIZ`.
- Low HP, stationary/slow, high first-shot threat.
- Special rule: `blackWaterWake`.
  - Hidden while in black-water cells unless lit, damaged, or close.
  - First ranged attack has high accuracy after a ripple telegraph.
  - On dry cells it becomes weak and slow.

## Generation And Reachability

- Floor weights: `MAINTENANCE`.
- Convert `black_slime_eyes.ts` to spawn `MonsterKind.CHERNOSLIZ`.
- Spawn near black slime pools, pumps, collector bends.

## Counterplay

- Do not step face-first into black water.
- Use light, thrown junk, or a probing shot.
- Pull it out of water if level geometry allows.

## Done

- Authored black slime content uses a named monster kind.
- Hidden state is local and test-covered.
- No old `black_slime_eye` registry lookup remains.

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
