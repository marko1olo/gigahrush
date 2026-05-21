# Addmonster 35: Протокольник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `court_nightmare`.
- Lore-facing old name: `Протокольное Кошмарище`.

## Hard Rule

Standalone monster package only. It must not be a prefixed `NIGHTMARE`; it is a document-pressure horror.

## Gameplay Role

Ministry PSI predator whose pressure scales with carried official papers and fight duration.

Player decision: drop/stash documents, burst it quickly, or abandon the room before the protocol closes.

## Sprite Plan

- New sprite module: `src/entities/protokolnik.ts`.
- Silhouette: tall folded black robe made of paper pages with a faceless stamp-head.
- Palette: black ink, yellow paper, red stamp marks, bruised violet edges.
- Procedural generation:
  - Draw layered paper strips as a robe.
  - Add red stamp circles/squares at random page joints.
  - Add no eyes; use a blank stamp plate for the face.
- Readability mark: papers orbit faster as PSI pressure rises.

## AI Plan

- New `MonsterKind.PROTOKOLNIK`.
- High PSI pressure, medium HP, poor melee.
- Special rule: `protocolPressure`.
  - Pressure grows with fight time and carried document count/tag value.
  - Dropping/stashing papers reduces future growth but may create retrieval risk.
  - Long exposure triggers log/HUD pressure but not unavoidable instant death.

## Generation And Reachability

- Floor weights: `MINISTRY`.
- Spawn in court/registry/archive POIs, not generic apartment halls.
- Rewrite old modifier rumor ids into normal monster rumor ids.

## Counterplay

- Do not fight it with a full document stack.
- Burst or leave before pressure stacks.
- Use cabinets/desks as line-of-sight breaks if supported.

## Done

- Document pressure is testable and capped.
- No old `court_nightmare` id remains.
- Kill/escape events identify `MonsterKind.PROTOKOLNIK`.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
