# Addmonster 16: Борщевик

## Source

- https://neosamosbor.fandom.com/ru/wiki/Борщевик
- https://samosbor.shoutwiki.com/wiki/Борщевик

## Current Coverage

No hostile hogweed/root plant. Existing fungus covers mycelium, not a mobile/creeping plant with burns, hallucination seeds, and concrete-damaging roots.

## Gameplay Role

Plant hazard-creature for service floors, abandoned farms, and procedural biota rooms. It blocks routes, damages exposed skin, and can pull down weak structures if ignored.

Player decision: cut/burn path, harvest seed/resource, reroute, or call/report borщеводы/liquidators.

## Visual And Sprite Plan

- New sprite file: `src/entities/borshchevik.ts`.
- Silhouette: tall umbrella plant, thick hollow stem, spreading leaves, root tendrils at base.
- Palette: pale green, white flower umbrella, purple-black burns on stem, yellow sap spots.
- Procedural generation:
  - Draw vertical stem with leaf clusters.
  - Umbel flower as many small white dots at top.
  - Root/tendril base crawling sideways.
  - Lore seed states: Sosnitsky burn, Namazov crawler, Vitalik hallucination.
- Sprite should be tall and readable in raycaster, not a flat bush.

## AI Plan

- New `MonsterKind.BORSHCHEVIK`.
- Mostly rooted; some crawler form can slowly migrate along walls.
- `burnSapPlant` behavior:
  - Contact or melee attack applies burn/damage.
  - Seed puff causes short hallucination/aim or map noise if close.
  - Roots damage a weak wall/door only in authored or sparse tracked cells.
- Fire kills fast but creates smoke/spore burst. Cutting is safer but slower.

## Generation And Reachability

- Procedural biota/mushroom floors, roof/greenhouse route if relevant, abandoned service rooms.
- Add local POI with blocked corridor and alternate route.
- Do not add global plant spread.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/borshchevik.ts`.
- `src/systems/ai/monster.ts` or small plant-root system for rooted attacks.
- `src/systems/cell_hazards.ts`: sap/seed puff if not already covered.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `borshchevik_cut`, `borshchevik_burned`, `borshchevik_seed_puff`.
- Tests: rooted no-path movement, smoke burst cap.

## Counterplay

- Wear protection or keep distance.
- Cut stems to open path with less smoke.
- Burn quickly but step back from seed/smoke.
- Report/mark infestation for faction reward.

## Done

- It blocks a route and gives at least two resolution methods.
- No unbounded spreading roots.
- Sap/seed effects are readable and short.

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
