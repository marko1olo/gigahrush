# Addmonster 08: Черные ликвидаторы

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

Liquidator-style NPCs and factions exist, but no post-samosbor false cleanup patrol. This is not a faction unit; it is a monster that abuses player trust in cleanup procedure.

## Gameplay Role

Aftermath encounter. A patrol arrives after severe samosbor and behaves like a cleanup team until the player notices impossible cues.

Player decision: comply, hide evidence, challenge them, or flee before they knock.

## Visual And Sprite Plan

- New sprite file: `src/entities/black_liquidator.ts`.
- Silhouette: human in old liquidator coat/helmet, blackened mask, long tool bag, rigid posture.
- Palette: near-black coat, dark rubber mask, white chalk numbers, red lens glints.
- Procedural generation:
  - Humanoid coat with gas mask circle and filter canister.
  - Add old armband or faded seal as 1px marks.
  - Tool bag/black hook in one hand.
  - Generate 12 subtle seeded silhouettes with mask number/height differences for patrol feeling.
- Avoid making them look like normal friendly NPCs at combat distance; the mask should be wrong.

## AI Plan

- New `MonsterKind.BLACK_LIQUIDATOR`.
- `falsePatrol` AI flag:
  - Starts neutral or slow-walking unless player opens a sealed door, carries forbidden sample, or approaches too close.
  - Patrols between door cells using a small generated waypoint list.
  - Knocks at doors as event/log, but does not run full room scans.
- Combat:
  - Medium ranged or melee baton/hook, slow but coordinated.
  - Always spawns in small fixed group, not infinite 12 unless authored event asks for it.
- Can collect corpses/items as visual aftermath, but item removal must be bounded and evented.

## Generation And Reachability

- Spawn only from severe samosbor aftermath, false safe block escalation, or authored post-samosbor POI.
- Rare on `LIVING`, `KVARTIRY`, `MINISTRY`.
- Debug scenario: trigger fake cleanup after samosbor.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/black_liquidator.ts`.
- `src/systems/samosbor.ts` or director aftermath hook.
- `src/systems/ai/monster.ts`: patrol/neutral reveal behavior.
- `src/systems/events.ts`: `false_liquidator_knock`, `false_liquidator_revealed`.
- `src/data/rumors.ts`: warnings about wrong count, wrong masks, and old uniforms.
- Tests: aftermath spawn cap and reveal triggers.

## Counterplay

- Check ID/signage/voice before opening.
- Hide or surrender samples for different outcomes.
- Light and witnesses reveal wrong faces.
- Fighting one group is possible; staying for repeated knocks is not.

## Done

- Aftermath-only spawn path.
- Patrol has a readable fake-normal phase.
- It cannot wipe a whole floor through unbounded cleanup logic.

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
