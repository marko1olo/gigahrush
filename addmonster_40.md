# Addmonster 40: Ложный Дух

## Source

- Former registry entry: `src/data/monster_variants.ts` id `false_spirit`.
- Lore-facing old name: `Ложный Дух`.

## Hard Rule

Standalone monster package only. It can be called a spirit in lore, but must not inherit `SPIRIT` as a modifier.

## Gameplay Role

Door-ignoring flanker that punishes turtling behind closed rooms. It is not raw damage; it breaks a specific defensive habit.

Player decision: reposition into open space, use a precise ranged/UV-style answer if present, or keep moving instead of hiding.

## Sprite Plan

- New sprite module: `src/entities/lozhnyy_dukh.ts`.
- Silhouette: pale side-profile ghost with an impossible second face inside the chest.
- Palette: cold white, gray-blue transparency, black mouth void.
- Procedural generation:
  - Draw a translucent vertical body with offset head.
  - Add an inner false face at chest height.
  - Break body edges into door-frame-shaped gaps.
- Readability mark: it leans through doors/walls before crossing.

## AI Plan

- New `MonsterKind.LOZHNYY_DUKH`.
- Low HP, high flank pressure, weak after reveal.
- Special rule: `falsePhase`.
  - Ignores closed doors for one flank move after a cold-draft telegraph.
  - Cannot chain phase repeatedly; cooldown is long.
  - Precise ranged/light hit during phase interrupts and weakens it.

## Generation And Reachability

- Floor weights: `VOID`, `MINISTRY`, rare `LIVING`.
- Spawn near office doors, void seams, sealed rooms with escape alternatives.
- Add rumor about doors not changing its path.

## Counterplay

- Do not hide behind one door and wait.
- Move into open space after cold draft.
- Interrupt the phase if equipped.

## Done

- Phase ignores doors only through a local controlled move.
- It cannot tunnel arbitrary walls indefinitely.
- No `false_spirit` id remains.

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
