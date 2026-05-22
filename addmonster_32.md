# Addmonster 32: Ржавник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `rust_rebar`.
- Lore-facing old name: `Ржавая Арматура`.

## Hard Rule

Standalone monster package only. It must not be a speed-tuned `REBAR`; it is a scrap-disguise ambusher.

## Gameplay Role

Warehouse/shelf lurker that looks like useful scrap until the player approaches carelessly.

Player decision: poke suspicious metal from range, take the risk for loot speed, or route around storage clutter.

## Sprite Plan

- New sprite module: `src/entities/rzhavnik.ts`.
- Silhouette: low bundle of rods that unfolds into a crooked metal walker.
- Palette: rusty orange, black oil, pale concrete dust.
- Procedural generation:
  - Idle drawing resembles a pile of parallel rods.
  - Aggro drawing unfolds a triangular leg shape.
  - Seed rust flakes and missing rod ends.
- Readability mark: suspiciously straight rod stack before wake.

## AI Plan

- New `MonsterKind.RZHAVNIK`.
- Low-to-medium HP, fast first leap, weak sustained fight.
- Special rule: `scrapWake`.
  - Starts dormant in storage/debris cells.
  - Wakes on close approach, loud metal interaction, or ranged poke.
  - First leap is strong; after landing it becomes fragile.

## Generation And Reachability

- Floor weights: `MAINTENANCE`, rare `LIVING` repair rooms.
- Spawn near shelves, scrap piles, cable/pipe content.
- Avoid spawning where all scrap becomes suspect; keep it sparse.

## Counterplay

- Shoot/poke suspicious straight metal.
- Keep distance from storage racks.
- Dodge the first leap, then finish quickly.

## Done

- Dormant state is local and does not replace item generation.
- Storage placement is authored/feature-driven.
- No `rust_rebar` id remains.

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
