# Addmonster 37: Хоровая Матка

## Source

- Former registry entry: `src/data/monster_variants.ts` id `choir_matka`.
- Lore-facing old name: `Хоровая Матка`.

## Hard Rule

Standalone monster package only. It is not `MATKA` with a prefix; it is a separate spawner encounter with its own cadence and tells.

## Gameplay Role

Hell-floor spawner that announces waves through a wet choir. It forces target priority: clean the children or rush the source.

Player decision: kill the source under pressure, clear offspring to open a damage window, or flee before the corridor fills.

## Sprite Plan

- New sprite module: `src/entities/khorovaya_matka.ts`.
- Silhouette: swollen hanging womb-mouth with several small face buds around it.
- Palette: dark red flesh, gray membranes, black throat holes, pale child-face spots.
- Procedural generation:
  - Draw one heavy central sac and 4 to 7 face buds.
  - Add throat holes as black ellipses of different sizes.
  - Add pulsing membrane bands before spawning.
- Readability mark: face buds open in sequence as countdown.

## AI Plan

- New `MonsterKind.KHOROVAYA_MATKA`.
- High HP, low movement, spawner pressure.
- Special rule: `choirCountdown`.
  - Emits audible/log cadence before spawning.
  - Child count is capped; killing children creates a short vulnerability window.
  - Ignoring the source increases route blockage, not infinite entity spam.

## Generation And Reachability

- Floor weights: `HELL`.
- Spawn in flesh rooms, choir tax/altar content, deep organic POIs.
- Integrate through existing matka/spawn systems only with generic hooks.

## Counterplay

- Listen for countdown and choose source vs children.
- Use chokepoints, but do not let offspring fill the exit.
- Burst the source during vulnerability.

## Done

- Spawn cap and vulnerability window are tested.
- Audio/log countdown is clear.
- No `choir_matka` id remains.

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
