# Addmonster 33: Глубинная Тень

## Source

- Former registry entry: `src/data/monster_variants.ts` id `deep_shadow`.
- Lore-facing old name: `Глубокий Теневик`.

## Hard Rule

Standalone monster package only. Lore may call it a теневик; runtime must give it its own kind and behavior.

## Gameplay Role

Deep-dark ambusher with a delayed second body. It punishes chasing a shadow after the first dodge.

Player decision: hold a lit exit, ignore the bait, or commit resources to reveal the real body.

## Sprite Plan

- New sprite module: `src/entities/glubinnaya_ten.ts`.
- Silhouette: tall black negative-space body with a second faint offset torso.
- Palette: black, blue-gray edge, faint white eye cuts.
- Procedural generation:
  - Draw main body as broken vertical shadow strips.
  - Draw offset afterimage thinner and lower alpha.
  - Seed small void holes inside the torso.
- Readability mark: afterimage lags behind by one movement beat.

## AI Plan

- New `MonsterKind.GLUBINNAYA_TEN`.
- Medium HP, high ambush damage, low direct chase.
- Special rule: `secondBeat`.
  - First dash creates/uses a delayed afterimage line.
  - If player chases into darkness, second beat strikes from offset angle.
  - Bright light or holding position collapses the afterimage.

## Generation And Reachability

- Floor weights: `HELL`, `VOID`.
- Spawn near deep fog, void seams, dark exits, chapel/altar aftereffects.
- Keep encounters sparse and readable.

## Counterplay

- Do not chase the first silhouette.
- Keep a lit exit behind you.
- Force it into light before the second beat.

## Done

- Afterimage is monster-local state.
- No global shadow AI is changed.
- No `deep_shadow` id remains.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
