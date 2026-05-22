# Addmonster 02: Гнилушка

## Source

- https://samosb0r.fandom.com/ru/wiki/Гнилушка

## Current Coverage

No exact game monster. `NELYUD` is a hostile false human; `ZOMBIE` is an undead neighbor. Гнилушка should be visibly altered, conversational, usually non-hostile, and only dangerous when trapped or attacked.

## Gameplay Role

Rare anomaly-mutant encounter that tests restraint. She is not a normal monster pack member. The player can talk, help, follow, hand over to scientists/liquidators, rob, or attack.

Implementation should use monster infrastructure for danger, but NPC interaction hooks for the first state.

## Visual And Sprite Plan

- New sprite file: `src/entities/gnilushka.ts`.
- Silhouette: thin human woman, blackened skin, gray hair mass, two antler-like head growths.
- Palette: matte black skin, gray-white hair, green-gray rot edge, amber/white eyes.
- Procedural generation:
  - Tall narrow body, asymmetric dress/coat silhouette.
  - Horns drawn as branching 1px antlers from head.
  - Seeded rot spots on arms and cheeks.
  - Two stance drawings: calm with lowered arms, defensive with widened claws.
- Optional particle/mark: faint gray flakes behind movement.

## AI Plan

- New `MonsterKind.GNILUSHKA` or a hybrid `EntityType.NPC` with `monsterKind` only after aggro. Prefer monster kind for combat registry, but spawn as `Faction.WILD` neutral until threatened.
- Base behavior:
  - Avoids player if armed and close.
  - Opens dialogue when approached calmly.
  - Flees to nearest low-danger room if hit or if too many NPCs converge.
  - If cornered, switches to fast defensive melee for a short burst.
- No normal samosbor spawn spam. Use rare authored/procedural anomaly rooms.

## Generation And Reachability

- One rare Living/Kvartiry "lost cell" POI: room with old personal items, no memory, optional escort to Yakov/Olga/liquidators.
- Procedural floors: only if anomaly tags include `samosbor_seed`, `false_safe_block`, or `mushroom_mycelium`.
- Debug path through map editor and a direct teleport/spawn.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/gnilushka.ts`.
- `src/data/monster_ecology.ts`: rare neutral entry with `rare: true`, low or zero generic weight.
- `src/data/plot.ts` or local side quest module: optional delivery/report outcomes.
- `src/systems/ai/monster.ts`: neutral/flee/defensive branch, or reusable `closeReveal`-like `defensiveNeutral` flag.
- `src/systems/events.ts`: `gnilushka_spared`, `gnilushka_hurt`, `gnilushka_delivered`.
- `src/data/rumors.ts`: rumors should frame her as ambiguous, not guaranteed hostile.

## Counterplay

- Light and distance keep the encounter readable.
- Attacking creates a fight, but sparing can yield information or sample reward.
- Liquidator handoff pays but costs relation/karma with scientists or civilians.

## Done

- Can be reached without debug.
- Has a non-combat branch.
- Defensive combat is dangerous but bounded.
- Logs distinguish "spared" from "killed mutant".

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
