# Addmonster 24: Панельник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `panel_tvar`.
- Lore-facing old name: `Панельная Тварь`.

## Hard Rule

Standalone monster package only. Lore can call it a wall-born тварь; mechanics must be authored as a separate monster.

## Gameplay Role

Wall-anchor bruiser for panel housing. It is strong while touching a wall and much worse in the center of a room.

Player decision: fight near the wall and save movement, or bait it into open floor and lose time/noise.

## Sprite Plan

- New sprite module: `src/entities/panelnik.ts`.
- Silhouette: broad shoulder slab, one arm fused into a concrete panel rib.
- Palette: beige-gray panel dust, rusty rebar darks, raw red mouth seam.
- Procedural generation:
  - Draw rectangular slab segments over an organic body.
  - Add rebar scratches and chipped panel corners.
  - Add wall-facing scrape marks on the fused arm.
- Readability mark: wall-side arm brightens with dust when armor is active.

## AI Plan

- New `MonsterKind.PANELNIK`.
- High HP near walls, medium HP behavior in open floor.
- Special rule: `wallBrace`.
  - If adjacent to wall, gains damage reduction and shove reach.
  - If pulled at least two cells from wall, loses brace and slows briefly.
  - Can scrape walls to telegraph route, but does not dig arbitrary tunnels.

## Generation And Reachability

- Floor weights: `LIVING`, `KVARTIRY`, rare maintenance service corridors.
- Spawn in panel rooms, cracked corridors, stair approaches.
- Add ecology/rumor text as normal monster data.

## Counterplay

- Step into center floor before trading hits.
- Use doors/corners to break brace.
- Do not melee it while its fused arm touches wall.

## Done

- Wall adjacency check uses existing toroidal helpers and radius caps.
- Armor cue is visible in sprite/HUD/log.
- Old `panel_tvar` entry is not referenced.

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
