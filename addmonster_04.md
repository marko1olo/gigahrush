# Addmonster 04: Туманные акулы

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

No air-swimming pack enemy. `EYE` flies and shoots, but does not behave like a melee pack that rides fog and explodes to fire.

## Gameplay Role

Fog-only pack predator for samosbor aftermath, flooded fog corridors, and rare cult/black-market bait content. They should make fog density tactically meaningful.

Player decision: leave fog, use fire and risk explosion, or break line and wait until fog thins.

## Visual And Sprite Plan

- New sprite file: `src/entities/fog_shark.ts`.
- Silhouette: small side-facing shark, crescent body, exaggerated metal teeth, ragged dorsal fin.
- Palette: purple fog gray, blue-black top, silver teeth, gas-belly pale highlight.
- Procedural generation:
  - Ellipse body with triangular fins.
  - Teeth as alternating light pixels along snout.
  - Belly gas sac as semi-transparent-looking pale patch.
  - Seeded scars and metal jaw differences.
- Sprite should read as airborne: no legs, slight upward angle, fog fringe pixels.

## AI Plan

- New `MonsterKind.FOG_SHARK`.
- `fogSwimmer` AI flag:
  - Full speed only when current cell fog/samosbor pressure is active or room has fog tag.
  - Outside fog, speed and turn rate drop sharply.
- Pack count 3 to 6, low HP, high bite burst.
- Fire interaction:
  - Flame damage kills or triggers small explosion on death.
  - Explosion damages nearby sharks and can hurt player/NPC if too close.
  - Cap explosion radius and event count.
- No wall phasing. They "swim" through open corridors only.

## Generation And Reachability

- Spawn from `samosbor` aftermath and selected `SAMOSBOR_VARIANTS`.
- Ecology weight on `HELL`, `MAINTENANCE`, procedural `smog`/`samosbor_seed`, and rare `LIVING` events.
- Debug spawn should include a fog patch or warning that it is slow without fog.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/fog_shark.ts`.
- `src/systems/ai/monster.ts`: `fogSwimmer` speed modifier and pack target.
- `src/systems/samosbor.ts`: optional aftermath spawn hook.
- `src/systems/audio.ts`: gas hiss and bite snap.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `fog_shark_ignited`, `fog_shark_pack_sighted`.
- Tests: speed modifier and explosion cap.

## Counterplay

- Leave fog or ventilate/route around it.
- Fire is effective but dangerous at close range.
- Doors and corners break pack rush.
- Shooting is safe but ammo-expensive.

## Done

- Only dangerous in fog or shortly after samosbor.
- Fire explosion is bounded and readable.
- No per-frame full-world fog scans.

## Third-Pass Audit (2026-05-22)

Second run left a partial package. Keep `MonsterKind.FOG_SHARK`, `src/entities/fog_shark.ts`, existing ecology/rumors, and the current fog/pack AI hooks. Finish the missing `Done` items: fire/explosion counterplay, `fog_shark_ignited` event output, and focused tests for fog speed or dry slowdown plus bounded explosion behavior. Do not replace this with a generic swarm, samosbor modifier, or second shark package.

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
