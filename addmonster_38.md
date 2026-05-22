# Addmonster 38: Канцелярский Идол

## Source

- Former registry entry: `src/data/monster_variants.ts` id `office_idol`.
- Lore-facing old name: `Канцелярский Идол`.

## Hard Rule

Standalone monster package only. It is not a stationary idol with a document modifier; it owns its office-field rules.

## Gameplay Role

Stationary Ministry hazard-monster that weaponizes desks, forms, and open office lines.

Player decision: cross the office line fast, fight from cabinet cover, or remove paper pressure before engaging.

## Sprite Plan

- New sprite module: `src/entities/kantselyarskiy_idol.ts`.
- Silhouette: black seated/standing figure fused with a desk-like base and paper halo.
- Palette: matte black, yellow paper, red stamp marks, dirty brass corners.
- Procedural generation:
  - Draw a rigid central idol shape with rectangular desk base.
  - Add orbiting paper rectangles in a loose halo.
  - Add red stamp pixels that align into a false face.
- Readability mark: paper halo points toward the current target line.

## AI Plan

- New `MonsterKind.KANTSELYARSKIY_IDOL`.
- Stationary or very slow, high ranged/PSI pressure, low close defense.
- Special rule: `officeField`.
  - Gains aim/pressure through desk/form/cabinet zones and carried papers.
  - Has a recovery window after each office-field shot.
  - Loses power if player closes distance or uses solid cover.

## Generation And Reachability

- Floor weights: `MINISTRY`.
- Spawn in office halls, registry rooms, archive set pieces.
- Add normal event data by monster kind and system tag.

## Counterplay

- Use cabinets/walls, not open medium distance.
- Close in during recovery.
- Do not carry paper stacks through its line unless needed.

## Done

- Stationary pressure does not rely on old `office_idol` entry.
- Cover/recovery are readable.
- Ministry spawn placement is authored enough to avoid unfair lines.

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
