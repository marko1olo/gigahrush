# Addmonster 28: Слепоглаз

## Source

- Former registry entry: `src/data/monster_variants.ts` id `blind_eye`.
- Lore-facing old name: `Слепой Глаз`.

## Hard Rule

Standalone monster package only. It may visually echo eye monsters; it must own its firing logic and registry entry.

## Gameplay Role

Blind-fire turret that overcommits to the last known player position. It is lethal at range but weak after a missed shot.

Player decision: bait the line shot, sidestep, then rush or fire during recovery.

## Sprite Plan

- New sprite module: `src/entities/slepoglaz.ts`.
- Silhouette: hanging oval eye shell with sealed pupil and broken optic nerves.
- Palette: dull green, gray membrane, black socket scars.
- Procedural generation:
  - Draw a closed central slit instead of an open pupil.
  - Add radial cracks and hanging nerve cords.
  - Draw a faint green beam seed during charge.
- Readability mark: sealed eye pulses toward the last sound, not the player.

## AI Plan

- New `MonsterKind.SLEPOGLAZ`.
- Medium HP, low melee, high ranged burst, long cooldown.
- Special rule: `lastSoundBeam`.
  - Tracks last loud player position or last seen cell.
  - Fires a cone/line there after a visible charge.
  - After firing, aim is poor and close defense is weak.

## Generation And Reachability

- Floor weights: `MAINTENANCE`, `HELL`.
- Spawn in long lines with side-step space, not sealed kill boxes.
- Add rumor about a green shot fired at where you were.

## Counterplay

- Make sound, step aside, close in after the beam.
- Avoid straight wet/service corridors during charge.
- Use doors only after the shot, not before charge completes.

## Done

- Ranged behavior does not depend on old `EYE` modifier logic.
- Beam telegraph is readable.
- No `blind_eye` id remains.

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
