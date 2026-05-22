# Addmonster 23: Безэхий

## Source

- Former registry entry: `src/data/monster_variants.ts` id `silent_polzun`.
- Lore-facing old name: `Тихий Ползун`.

## Hard Rule

Standalone monster package only. It can share crawler mood in lore, but must not inherit `POLZUN` mechanics through a modifier layer.

## Gameplay Role

Door-threshold ambusher that removes one expected warning channel. It is not invisible; it is quiet until the player gives it their back.

Player decision: check thresholds before looting, shut doors behind you, or accept a faster route with rear risk.

## Sprite Plan

- New sprite module: `src/entities/bezekhiy.ts`.
- Silhouette: thin crawler pressed flat to door frames and baseboards.
- Palette: matte gray, pale gum line, dusted elbows.
- Procedural generation:
  - Draw a compressed body that looks almost like a dirty floor strip from distance.
  - Add narrow white finger pixels around the door-side edge.
  - Add slight asymmetric neck bend for recognition.
- Readability mark: no glow; the tell is missing echo plus a frame-edge hand.

## AI Plan

- New `MonsterKind.BEZEKHIY`.
- Low-to-medium HP, low frontal pressure, high backstab pressure.
- Special rule: `deadEcho`.
  - Suppresses idle audio and routine log warnings until within a short radius.
  - Gains a one-time lunge if the player crosses its threshold with back turned.
  - Loses the bonus after first reveal or if directly looked at for a short hold.

## Generation And Reachability

- Floor weights: `LIVING`, `KVARTIRY`, rare `MINISTRY`.
- Spawn near doors, closets, apartment thresholds, false-neighbor rooms.
- Add a normal rumor about a door that stops echoing.

## Counterplay

- Keep doors closed behind the player.
- Sweep thresholds before looting.
- Backpedal through doors instead of sprinting blindly.

## Done

- Rear-threshold logic is local and deterministic.
- Audio suppression does not globally mute other systems.
- No `silent_polzun` registry id remains.

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
