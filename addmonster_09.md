# Addmonster 09: Ковер

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

No floating carpet/spore creature. Existing fungus is room/root hazard; this is a mobile, deceptively domestic object.

## Gameplay Role

Quiet domestic trap for apartments, offices, and abandoned corridors. It should look like loot/furniture until it shifts, then releases spores or blocks a doorway.

Player decision: burn it, salt it, step around, or risk crossing for loot.

## Visual And Sprite Plan

- New sprite file: `src/entities/spore_carpet.ts`.
- Silhouette: low flat rectangle/rag, curled corners, hovering shadow, pulsing vein pattern.
- Palette: dirty red/brown textile, green-black veins, pale mold fringe.
- Procedural generation:
  - Draw perspective-ish low rug rectangle with ragged alpha edges.
  - Add vein network using seeded random walks across surface.
  - Add lifted corner and dark underside.
  - Room-color states: red Soviet rug, gray office mat, black mold rug.
- Because billboard sprites are vertical, make it read as a hanging/floating curled carpet rather than a pure floor decal.

## AI Plan

- New `MonsterKind.SPORE_CARPET`.
- `lurkingFurniture` AI flag:
  - Idle until player/NPC comes within 2 cells, shoots it, or opens nearby container.
  - Slow float toward target, attempts to occupy doorway/escape line.
  - Periodic short spore puff in radius, not projectile spam.
- Spore effect:
  - Low damage plus brief aim/vision penalty if status/HUD supports it.
  - Fire makes it recoil and stops spore puff.

## Generation And Reachability

- Apartments, offices, storage, false safe blocks, mushroom floors.
- Never spawn more than a few per zone.
- Place near visible loot or door threshold, with mold marks as warning.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/spore_carpet.ts`.
- `src/systems/ai/monster.ts`: idle trigger and door-blocking target choice.
- `src/systems/status.ts` / HUD effect if adding spore haze.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `spore_carpet_woke`, `spore_carpet_burned`.
- Tests: idle trigger and spore cooldown.

## Counterplay

- Read mold veins and lifted corners.
- Burn or salt before crossing.
- Do not fight in a doorway while it blocks exit.
- Gas mask/oxygen gear can reduce spore effect.

## Done

- Looks domestic until close but has warning details.
- Spore puffs are cooldown-capped.
- Has room/loot placement that creates a real choice.

## Third-Pass Audit (2026-05-22)

Current tree has no `MonsterKind.SPORE_CARPET`, no `src/entities/spore_carpet.ts`, and no carpet AI/tests. `src/gen/maintenance/pressovik.ts` and `tests/monster_09_pressovik.test.ts` are unrelated content and must be preserved, not treated as this monster. Implement the carpet package directly under the ids named in this file.

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
