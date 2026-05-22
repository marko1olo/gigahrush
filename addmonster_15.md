# Addmonster 15: Кровавое растение

## Source

- https://samosbor.shoutwiki.com/wiki/Кровавые_растения

## Current Coverage

Fungus exists, but no blood/root hivemind plant with infected human stages and red mold distribution.

## Gameplay Role

Hivemind plant encounter that starts as contraband/social infection and ends as root combat. It should connect drugs, cult-style recruitment, and route blocking.

Player decision: burn roots, expose distributors, harvest red mold, or cut a path and leave the colony alive.

## Visual And Sprite Plan

- New sprite file: `src/entities/blood_plant.ts`.
- Silhouette: red-black root trunk with partial human shape/face in bark, tendrils like veins.
- Palette: dark red, black bark, wet pink highlights, pale eye/flower dots.
- Procedural generation:
  - Central root column with branching tendrils.
  - Add vein network using red random walks.
  - Human facial suggestion in trunk, not explicit gore.
  - Flower/seed state with bright red spores.
- Infected humans can reuse NPC sprites with red vein overlay later; first pass monster is root avatar.

## AI Plan

- New `MonsterKind.BLOOD_PLANT`.
- Mostly stationary/rooted boss-like source.
- `rootHive` behavior:
  - Sends short tendril strikes through nearby floor cells.
  - Spawns or buffs a tiny number of infected thralls only from authored event, capped.
  - Heals slowly if red mold containers remain nearby.
- Vulnerable to fire, salt, and cutting tools.

## Generation And Reachability

- Abandoned garden/biota block, cult drug den, procedural mushroom/false-safe floor.
- Never generic early spawn.
- A POI should include red mold item choice and witness consequences.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/blood_plant.ts`.
- `src/systems/ai/monster.ts`: rooted attack and heal source.
- `src/data/items.ts` or existing contraband: red mold sample later.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `blood_plant_root_cut`, `red_mold_exposed`, `blood_plant_burned`.
- Tests: rooted range cap and source-heal removal.

## Counterplay

- Burn or salt roots before entering center.
- Destroy red mold stash to stop healing.
- Do not accept easy "happy" buff from infected distributors.
- Cutting a path is faster than full cleanse but leaves future risk.

## Done

- Root source has a clear room-scale loop.
- Social infection remains bounded to POI/quest events.
- Fire/salt/cut options all work.

## Third-Pass Audit (2026-05-22)

Partial package exists. Keep `MonsterKind.BLOOD_PLANT`, `src/entities/blood_plant.ts`, `src/systems/blood_plant.ts`, `red_mold_sample`, and existing ecology/rumors. Missing pieces: `rootHive` AI update, wiring fire/cut outcomes through `monster_counterplay`, authored reachable POI with a red mold choice, and focused tests for tendril cap, heal-source removal, and fire/cut events.

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
