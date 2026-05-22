# Addmonster 19: Комнатный обживальщик

## Source

- https://samosbor.shoutwiki.com/wiki/Аберрации

## Current Coverage

No room-bound aberration that stays in its apartment, feeds on neighbor pressure, and grows organic wall matter. Existing `NELYUD` and `ZOMBIE` leave the room and chase normally.

## Gameplay Role

Apartment-contained horror and social-route problem. The creature is dangerous mostly because neighbors, noise, and repeated visits make the room worse.

Player decision: ignore the sealed room, calm/report it, break in for loot, or burn/cut the growing organic patch before it spreads to a corridor.

## Visual And Sprite Plan

- New sprite file: `src/entities/obzhivalshchik.ts`.
- Silhouette: cramped hunched resident, too long fingers, red night eyes, furniture scraps fused to back.
- Palette: dirty apartment browns, black-gray skin, red eyes at night, pale mucus wall patches.
- Procedural generation:
  - Hunched humanoid tucked into a square-ish "room shell" silhouette.
  - Add chair/table fragments attached to body.
  - Add red eyes only as tiny high-contrast points.
  - Organic wall growth marks can be `render/marks.ts` or room feature, not sprite only.

## AI Plan

- New `MonsterKind.OBZHIVALSHCHIK`.
- `roomBoundAberration` AI flag:
  - Does not leave its room unless room is breached during samosbor or at high anger.
  - At night/low light, scratches walls and becomes more aggressive.
  - Noise, repeated door hits, or theft increases anger.
  - Calm/report interaction can reduce anger without combat.
- Organic growth:
  - Sparse room-local marks grow on wall cells on slow cooldown.
  - Growth should not spread globally.

## Generation And Reachability

- `KVARTIRY` and `LIVING` apartments, false safe blocks, procedural residential floors.
- Seed as a sealed/noisy room with neighbor rumor.
- Add optional contract: inspect without killing, or clear growth for sanitation.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/obzhivalshchik.ts`.
- `src/systems/ai/monster.ts`: room-bound leash and anger state.
- `src/systems/room_memory.ts` / `noise.ts`: use existing local facts for noise and witness pressure.
- `src/systems/events.ts`: `obzhivalshchik_scratched`, `obzhivalshchik_calmed`, `obzhivalshchik_breached`.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- Tests: room leash and bounded growth.

## Counterplay

- Do not break the door for curiosity.
- Use calm/report route if the objective allows.
- Burn/cut organic wall growth before it reaches a corridor.
- If fighting, pull it out only after clearing neighbors and exit.

## Done

- Encounter stays room-scale.
- Anger/growth are bounded and save-safe.
- Player has a non-kill resolution path.

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
