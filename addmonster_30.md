# Addmonster 30: Лампоглаз

## Source

- Former registry entry: `src/data/monster_variants.ts` id `lamp_eye`.
- Lore-facing old name: `Ламповый Глаз`.

## Hard Rule

Standalone monster package only. It must not be an eye monster with a lamp modifier; it is a light-linked turret.

## Gameplay Role

Lit-corridor shooter that becomes more accurate when the player stands under lamps. It makes light both safety and exposure.

Player decision: stay lit against other threats, cut the light and risk darkness, or break line of sight.

## Sprite Plan

- New sprite module: `src/entities/lampoglaz.ts`.
- Silhouette: hanging eye in a lamp socket halo, with cable roots above.
- Palette: yellow lamp glow, green pupil, dirty white porcelain, black cables.
- Procedural generation:
  - Draw a circular eye with a square lamp bracket above it.
  - Add yellow halo rings that vary by seed.
  - Add dangling cable roots as short curves.
- Readability mark: halo becomes sharp when the player is standing in light.

## AI Plan

- New `MonsterKind.LAMPOGLAZ`.
- Medium HP, ranged focused, low melee.
- Special rule: `lightLock`.
  - Gains aim/damage while target is in lit cells or near active lamps.
  - Loses lock in darkness or behind corners.
  - Can briefly flicker nearby lamps as a telegraph, but must not own a global lighting rewrite.

## Generation And Reachability

- Floor weights: `LIVING`, `MINISTRY`.
- Spawn near lamps, office hallways, long жилой corridor lines.
- Add normal rumors about yellow hum before green shot.

## Counterplay

- Break light or line of sight.
- Cross lit strips quickly.
- Fight from a dark corner after it fires.

## Done

- Uses existing light/floor data through bounded checks.
- Sprite halo is readable without old cue marks.
- No `lamp_eye` id remains.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
