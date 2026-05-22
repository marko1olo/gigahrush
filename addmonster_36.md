# Addmonster 36: Водяной Кошмар

## Source

- Former registry entry: `src/data/monster_variants.ts` id `wet_nightmare`.
- Lore-facing old name: `Водяное Кошмарище`.

## Hard Rule

Standalone monster package only. It can share nightmare mood in lore, but must own water-line PSI behavior as a separate kind.

## Gameplay Role

Maintenance horror that sends pressure through water lines. It is dangerous when the player retreats along the wet path.

Player decision: leave the water line, cross to dry concrete, or commit to a short burst before pressure ramps.

## Sprite Plan

- New sprite module: `src/entities/vodyanoy_koshmar.ts`.
- Silhouette: dark humanoid reflection standing partly under the floor plane.
- Palette: black-blue water, pale face smear, green-gray drain glow.
- Procedural generation:
  - Draw a normal upper body and inverted reflected lower body.
  - Add ripple rings around feet/hands.
  - Seed water streaks over the face.
- Readability mark: ripples point from monster to player along connected wet cells.

## AI Plan

- New `MonsterKind.VODYANOY_KOSHMAR`.
- Medium HP, medium speed, escalating PSI on water.
- Special rule: `waterPressureLine`.
  - If player and monster share connected wet/trail cells, pressure grows.
  - Dry cells break the line after a short delay.
  - The monster prefers routes that reconnect wet paths.

## Generation And Reachability

- Floor weights: `MAINTENANCE`.
- Spawn in pump rooms, flooded corridors, drain bridges.
- Add debug scenario with connected and disconnected water paths.

## Counterplay

- Step onto dry concrete.
- Stop retreating along the same wet line.
- Burst during dry-line interruption.

## Done

- Water connectivity check is bounded and slow-tick only.
- Wet-line cue is visible.
- No `wet_nightmare` id remains.

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
