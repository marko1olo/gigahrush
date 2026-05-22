# Addmonster 10: Рой

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

`KRYSNOZHKA` covers one food/garbage swarm species. Рой/Сворм should be a broader post-samosbor vent colony with a local queen/source and non-rat/insect mass behavior.

## Gameplay Role

Area-denial pressure that comes from vents, floor gaps, and service voids. It is not a normal single monster fight; the player should search for and destroy/block the source.

Player decision: seal vents, burn the queen/source, sprint through, or spend ammo clearing bodies.

## Visual And Sprite Plan

- New sprite file: `src/entities/swarm_mass.ts`.
- Silhouette: cloud/heap of tiny bodies, not one animal. Billboard reads as black-brown living static with legs/wings.
- Palette: black, rust brown, sick yellow eyes, occasional red larva dots.
- Procedural generation:
  - Use many small seeded dots/ellipses inside a loose oval.
  - Add peripheral legs/antennae lines.
  - Add density bands so center is opaque, edges noisy.
  - Seeded swarm silhouettes: roach-cloud, flea-knot, rat-insect mix.
- Optional floor marks for active vents: dark crumb trail.

## AI Plan

- New `MonsterKind.SWARM`.
- `sourceSwarm` AI flag:
  - Individual swarm entities are weak, fast, and short-lived.
  - A sparse source marker/queen spawns capped swarms on cooldown while player is near.
  - Destroying/sealing source stops respawns.
- Uses entity index radius queries; no scanning all vents every frame.
- Attack: low damage but high frequency and stamina/aim disruption if available.

## Generation And Reachability

- Procedural anomaly or room tag: `swarm_nest`.
- Kitchens, storage, maintenance vents, abandoned blocks.
- Avoid replacing `KRYSNOZHKA`; use on deeper/wilder floors or after samosbor.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/swarm_mass.ts`.
- New system may be better than broad AI-only: `src/systems/swarm_nests.ts` for sparse source records.
- `src/systems/ai/monster.ts`: swarm chase and quick decay.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `swarm_source_sealed`, `swarm_source_burned`.
- Tests: source cap, cooldown, and cleanup on floor transition.

## Counterplay

- Seal vent with tape/sealant.
- Fire clears many at once.
- Killing swarm bodies without stopping source wastes ammo.
- Food bait may redirect briefly, but source remains.

## Done

- Source-based loop exists.
- Swarm cap prevents entity explosion.
- Player can resolve nest without killing every body.

## Third-Pass Audit (2026-05-22)

Current tree has no `MonsterKind.SWARM`, no `src/entities/swarm_mass.ts`, no `src/systems/swarm_nests.ts`, and no source-cap tests. `MonsterKind.POMOYNY_ROY` belongs to addmonster_41 and `KRYSNOZHKA` is existing ecology; do not rename or reuse them for this creature. Implement the source-based nest loop and bounded cleanup described here.

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
