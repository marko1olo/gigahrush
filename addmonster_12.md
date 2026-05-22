# Addmonster 12: Лишенный

## Source

- https://samosbor.shoutwiki.com/wiki/Лишенные

## Current Coverage

`SHADOW` covers dark ambush behavior. Лишенные are distinct enough: deep-level shadow guardians that follow light sources and damage by contact/decay.

## Gameplay Role

Deep route guardian for `darkness`, `VOID`, and negative procedural floors. It turns light from pure safety into a lure risk.

Player decision: carry light and attract it, go darker and risk navigation, or use decoy light/noise to move it.

## Visual And Sprite Plan

- New sprite file: `src/entities/lishennyy.ts`.
- Silhouette: flat black human-shaped absence with stretched arms, floor/wall edge dissolving into powder.
- Palette: black core, gray ash edge, faint reflected light color on one side.
- Procedural generation:
  - Draw tall shadow body with no internal features.
  - Edge noise eats into silhouette.
  - Add gray powder flecks falling down.
  - Dynamic tint by floor or light source can be done through seeded sprite generation later.
- It must be darker and less agile-looking than `SHADOW`.

## AI Plan

- New `MonsterKind.LISHENNYY`.
- `lightFollower` AI flag:
  - Target selection weights active light sources, player flashlight/UV, lamps, dropped flare-like items if any.
  - Uses radius-limited queries and cached nearby feature check, not full lightmap scan.
- Contact applies decay:
  - Short touch damage, and optional lingering sickness/needs drain.
  - Breaking contact slows or stops decay.
- Avoids fully bright safe cells for a moment after UV/spotlight burst, but then follows light again.

## Generation And Reachability

- Deep procedural route floors below a z threshold, `darkness`, `VOID`, rare `HELL`.
- Never above early residential floors except authored nightmare event.
- Add debug teleport/spawn with darkness/light setup.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/lishennyy.ts`.
- `src/systems/ai/monster.ts`: light follower target weighting.
- `src/systems/uv_spotlight.ts` / lighting hooks: expose cheap "active player light" fact.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `lishennyy_lured`, `lishennyy_contact_decay`.
- Tests: follows light decoy and does not scan full map.

## Counterplay

- Use light decoys or turn light away to move it.
- UV burst buys a short gap, not a kill.
- Do not let it touch you long enough for decay.
- Door/geometry helps only if you break contact and line.

## Done

- Different from `SHADOW` in targeting and damage.
- Light is both tool and risk.
- Deep-floor ecology only.

## Third-Pass Audit (2026-05-22)

Current tree has no `MonsterKind.LISHENNYY`, no `src/entities/lishennyy.ts`, and no light-follower tests. `TONKAYA_TEN` and `GLUBINNAYA_TEN` are separate shadow replacements; do not collapse Lishennyy into either of them. Add a direct light-following monster with deep-floor reachability.

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
