# Addmonster 31: Закаленная Арматура

## Source

- Former registry entry: `src/data/monster_variants.ts` id `rebar_veteran`.
- Lore-facing old name: `Закаленная Арматура`.

## Hard Rule

Standalone monster package only. It may share the арматура family in fiction, but not through a mechanical derivation layer.

## Gameplay Role

Slow armored melee elite. It makes weak melee and panic pistol shots bad, while heavy stagger and route planning matter.

Player decision: spend heavy ammo, bait it around obstacles, or abandon the room until better equipped.

## Sprite Plan

- New sprite module: `src/entities/zakalennaya_armatura.ts`.
- Silhouette: upright metal-limbed figure with thick rebar spine and slab shoulders.
- Palette: dark tempered steel, concrete flakes, orange heat scars.
- Procedural generation:
  - Draw multiple parallel rebar rods as body bones.
  - Add heavy shoulder plates and welded knots.
  - Add orange heat lines only in cracks, not as a glow blob.
- Readability mark: armor plates chip off after heavy stagger.

## AI Plan

- New `MonsterKind.ZAKALENNAYA_ARMATURA`.
- High HP, low speed, high melee, strong weak-hit resistance.
- Special rule: `armorStrip`.
  - Weak hits mostly stagger less and chip little.
  - Shotgun/heavy/tool hits strip armor stacks with a visible event.
  - Once stripped, it becomes a normal slow target.

## Generation And Reachability

- Floor weights: `MAINTENANCE`, `HELL`.
- Spawn as rare guard near machinery, rebar cages, deep service rooms.
- Keep spawn count low to avoid heavy-monster clutter.

## Counterplay

- Use heavy stagger tools.
- Maintain distance; do not knife-trade armor.
- Leave and return if unprepared.

## Done

- Armor strip is its own monster state.
- Heavy-hit detection uses existing damage categories or minimal generic hooks.
- No old `rebar_veteran` id remains.

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
