# Addmonster 03: Зеленая собака

## Source

- https://samosbor.shoutwiki.com/wiki/Зелёная_Собака

## Current Coverage

No dog-like pack predator. `KRYSNOZHKA` is food/garbage swarm, `TVAR` is wall-biased melee. Зеленая собака needs pack howls, mossy body, and loud-metal counterplay.

## Gameplay Role

Civil/deep pack threat that starts as audio pressure at doors and corridors. It should punish opening a door to a pleading sound, but reward noise tools and preparation.

Player decision: stay sealed, scare them off with loud metal/noise, bait them away, or fight the pack.

## Visual And Sprite Plan

- New sprite file: `src/entities/green_dog.ts`.
- Silhouette: low quadruped, arched back, thin legs, long snout, torn ears.
- Palette: dirty gray fur, pale moss green patches, black gums, yellow eyes.
- Procedural generation:
  - Draw side-facing dog body with 4 stick legs and jagged fur.
  - Seed moss islands on back/head using green noise dots.
  - Mouth stripe opens red-black on aggressive state.
  - Pack silhouettes: pup, limping adult, moss-heavy alpha.
- Readability: bright green moss outline makes it distinct from `KRYSNOZHKA`.

## AI Plan

- New `MonsterKind.GREEN_DOG`.
- `packHowl` AI flag:
  - First sighting emits local event and sound cue.
  - Nearby dogs share target within a small radius using entity index query, not world scan.
  - Pack attempts flank by picking offsets around target when path is available.
- `noiseFear` counter:
  - Shotgun, thrown metal/noise, or interaction with pipes/valves gives a short fear state.
  - Fear state breaks pack target and sends dogs to wander away.
- Bite applies light poison/bleed if status system has room; otherwise use damage plus event detail.

## Generation And Reachability

- Spawn in abandoned residential/procedural floors, false safe blocks, and wild corridors.
- Add low-weight ecology on `KVARTIRY`, `LIVING`, `MAINTENANCE`.
- Possible POI: door with howling outside and a metal valve inside.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/green_dog.ts`.
- `src/systems/ai/monster.ts`: add `packHowl`, `noiseFear` behavior.
- `src/systems/noise.ts`: reuse existing noise records for fear trigger.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts` / `world_log.ts`: `green_dog_howl`, `green_dog_scared`.
- Tests: pack target sharing and noise fear without full scans.

## Counterplay

- Do not open doors just because a sound is sad.
- Loud metal/noise scares them for a few seconds.
- Fire and shotgun are strong; narrow doors are risky because pack body-blocks.
- Bait with food works, but may attract `KRYSNOZHKA`.

## Done

- Howl is audible/logged before contact.
- Pack coordination is radius-capped.
- Noise counterplay works in tests and in a reachable room.

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
