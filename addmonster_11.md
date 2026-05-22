# Addmonster 11: Слизневик

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

No slime symbiote/scavenger creature. The game has slime samples and slime hazards, but no living actor that gathers slime and can be bargained with or exploited.

## Gameplay Role

Mostly non-hostile wild mutant found in slime-heavy lost blocks. It offers a risky shortcut in slime ecology: trade food/medicine for slime cleanup or sample knowledge, but contact threatens infection or memory/psi cost.

Player decision: trade, steal sample, protect, kill for loot, or avoid.

## Visual And Sprite Plan

- New sprite file: `src/entities/slimevik.ts`.
- Silhouette: hunched humanoid or animal host wrapped in translucent slime backpack/tendrils.
- Palette: dark host body, glossy black/clear slime shell, faint blue-green highlights.
- Procedural generation:
  - Small humanoid body with oversized slime sac.
  - Sac contains suspended dots and sample colors.
  - Tendrils touch floor like extra arms.
  - Face mostly hidden, one human eye pixel optional.
- It must read as "symbiote scavenger", not `SLIME_WOMAN`.

## AI Plan

- New `MonsterKind.SLIMEVIK`, but spawn neutral.
- `slimeScavenger` AI flag:
  - Wanders toward nearby slime marks/rooms only within a cached local radius.
  - If attacked, flees; if cornered, uses weak corrosive lash.
  - If fed or traded with, marks one nearby slime sample or reduces local hazard for a short time.
- Contact risk:
  - Standing too close for too long can cause minor infection/psi drain unless protected.

## Generation And Reachability

- Maintenance slime rooms, living slime POIs, procedural `samosbor_seed` and `mushroom_mycelium` floors.
- Add one route rumor or contract to locate a "safe" slimevik.
- Do not spawn in starting hub.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/slimevik.ts`.
- `src/systems/ai/monster.ts` or small `slimevik` interaction system.
- `src/systems/interactions.ts`: `E` trade/help prompt.
- `src/data/slime_defs.ts`: optional sample clue reward.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `slimevik_bargain`, `slimevik_harvested`, `slimevik_killed`.

## Counterplay

- Keep distance without mask/gloves.
- Trade food/medicine instead of killing if you need sample info.
- Killing gives immediate loot but may spill slime hazard.

## Done

- Neutral behavior works and does not become ordinary refill.
- Interaction gives a concrete slime decision.
- Contact risk is bounded and visible.

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
