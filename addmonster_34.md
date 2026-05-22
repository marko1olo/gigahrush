# Addmonster 34: Тонкая Тень

## Source

- Former registry entry: `src/data/monster_variants.ts` id `thin_shadow`.
- Lore-facing old name: `Тонкий Теневик`.

## Hard Rule

Standalone monster package only. It is not a light stat adjustment on `SHADOW`; it is a bait-and-retreat monster.

## Gameplay Role

Cowardly lure that retreats just far enough to pull the player into a bad line. It is weak if the player refuses the chase.

Player decision: hold ground, use light/noise to pull it back, or chase and accept ambush risk.

## Sprite Plan

- New sprite module: `src/entities/tonkaya_ten.ts`.
- Silhouette: needle-thin shadow with long elbows and almost no torso.
- Palette: black, thin gray outline, faint blue joints.
- Procedural generation:
  - Draw body as 3 to 5 vertical strips.
  - Add long angular arms that point away from the player.
  - Seed small eye slits high on the head.
- Readability mark: it always faces away when baiting.

## AI Plan

- New `MonsterKind.TONKAYA_TEN`.
- Low HP, fast retreat, weak attack unless player crosses its prepared line.
- Special rule: `baitLine`.
  - Picks a nearby dark corridor/door line.
  - Retreats toward it while staying visible.
  - If player enters the line, it gets one flank strike; if player waits, it loses nerve and repositions.

## Generation And Reachability

- Floor weights: `MINISTRY`, `LIVING`, rare `VOID`.
- Spawn near long dark corridors and office/apartment turns.
- Add rumor about the shadow that wants you to follow.

## Counterplay

- Do not chase into the prepared line.
- Hold position and force it to return.
- Use light or noise to collapse the ambush route.

## Done

- Bait route selection is radius-capped.
- Weakness when ignored is clear.
- No `thin_shadow` id remains.

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
