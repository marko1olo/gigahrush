# Addmonster 39: Трубный Автомат

## Source

- Former registry entry: `src/data/monster_variants.ts` id `pipe_robot`.
- Lore-facing old name: `Трубный Робот`.

## Hard Rule

Standalone monster package only. It is not a `ROBOT` with wet-blue modifiers; it is a corridor-control machine.

## Gameplay Role

Maintenance machine that locks long wet corridors with a plasma/water line and then exposes a recovery window.

Player decision: step off the wet line, bait the shot, or fight in bad geometry for faster progress.

## Sprite Plan

- New sprite module: `src/entities/trubnyy_avtomat.ts`.
- Silhouette: squat service robot with pipe-ring torso and forward emitter.
- Palette: dark metal, blue pipe bands, rust, white-hot emitter core.
- Procedural generation:
  - Draw cylindrical torso bands as blue arcs/stripes.
  - Add pipe elbows on shoulders and back.
  - Add a small emitter lens that glows during charge.
- Readability mark: blue bands brighten before firing down a wet line.

## AI Plan

- New `MonsterKind.TRUBNYY_AVTOMAT`.
- High armor, slow speed, ranged burst, long recovery.
- Special rule: `wetLineShot`.
  - Prefers firing along wet corridor cells or connected drain lines.
  - Shot has visible charge and post-shot recovery.
  - Armor can be bypassed by flanking/close recovery attacks.

## Generation And Reachability

- Floor weights: `MAINTENANCE`.
- Spawn near pipe bridges, pump machinery, long service corridors.
- Replace old pipe-robot entry with direct monster ecology.

## Counterplay

- Leave the wet straight line before charge completes.
- Attack during recovery.
- Flank through dry side cells where available.

## Done

- Wet-line targeting is bounded.
- Recovery window exists and is test-covered.
- No `pipe_robot` id remains.

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
