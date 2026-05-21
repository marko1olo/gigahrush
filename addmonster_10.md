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

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
