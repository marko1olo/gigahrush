# Addmonster 22: Лоточник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `wet_polzun`.
- Lore-facing old name: `Мокрый Ползун`.

## Hard Rule

Standalone monster package only. It is not a `POLZUN` with a modifier; it is a wet-service predator with its own stats, sprite, ecology, and AI hook.

## Gameplay Role

Maintenance-floor crawler that is strong in drains and weak on dry concrete. It makes water routes a tactical choice instead of a flat movement surface.

Player decision: take the wet shortcut and fight an armored body, or pull it onto dry ground before committing.

## Sprite Plan

- New sprite module: `src/entities/lotochnik.ts`.
- Silhouette: low flattened crawler with broad wet palms and a gutter-like back.
- Palette: gray-blue skin, black water sheen, yellow drain residue.
- Procedural generation:
  - Draw a long flat body with paired wet hand marks.
  - Add blue drips from the belly and elbows.
  - Add a dark reflective strip along the back.
- Readability mark: body shine fades on dry cells.

## AI Plan

- New `MonsterKind.LOTOCHNIK`.
- Medium HP, slow on dry cells, fast and armored on water/sewer cells.
- Special rule: `drainArmor`.
  - While standing on water, gains damage reduction and small regeneration ticks.
  - On dry concrete, loses armor and leaves a short wet trail that decays.
  - Trail is visual/slow-tick data, not per-frame world scanning.

## Generation And Reachability

- Floor weights: `MAINTENANCE`, rare `LIVING` bathroom clusters.
- Spawn near drains, collectors, pump rooms, flooded corridors.
- Debug path: spawn on dry and wet cells to verify readable state change.

## Counterplay

- Pull it off water.
- Break pursuit across dry thresholds.
- Use fire/electricity only if existing systems already support water interactions.

## Done

- Wet/dry state changes stats and sprite without using old registry data.
- Spawn is tied to water features.
- AI has radius-capped checks and no hot-loop allocation.

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
