# Addmonster 21: Туманник

## Source

- Former registry entry: `src/data/monster_variants.ts` id `fog_sborka`.
- Lore-facing old name: `Туманная Сборка`.

## Hard Rule

Standalone monster package only. Lore can say it is kin to сборки; code must treat it as its own kind with no modifier inheritance.

## Gameplay Role

Fog-pocket ambusher that attacks from a displaced silhouette. It punishes players who wait for a clean visible body in dense fog.

Player decision: hold a corner and aim by sound, spend light/noise tools to reveal the real body, or retreat out of the pocket.

## Sprite Plan

- New sprite module: `src/entities/tumannik.ts`.
- Silhouette: incomplete gray humanoid with missing center mass and long blurred forearms.
- Palette: ash gray, cold blue edge, almost transparent fog holes.
- Procedural generation:
  - Draw body chunks with gaps and fog bands.
  - Offset one ghost afterimage 8 to 16 pixels sideways.
  - Add a denser real core that becomes visible only close or under light.
- Readability mark: real core has small black-red joint pixels; decoy silhouette does not.

## AI Plan

- New `MonsterKind.TUMANNIK`.
- Medium HP, medium speed, low direct damage, high ambush pressure.
- Special rule: `fogOffset`.
  - In fog cells it presents a fake visible position.
  - Attack origin is offset toward the loudest recent player movement.
  - Light, fire, or exiting fog collapses the offset for a short window.
- It should not be a global invisibility system; only this monster owns the behavior.

## Generation And Reachability

- Floor weights: `LIVING`, `HELL`, rare foggy procedural floors.
- Spawn only near rooms/corridors already tagged fog, ash, smoke, or aftershock.
- Add a normal rumor about side-sound before contact.

## Counterplay

- Do not chase the silhouette through fog.
- Use corners and sound; fire into the side cue, not the center mass.
- Light or fire makes the real body commit.

## Done

- Real and fake positions are readable at 64x64.
- Fog behavior is local to `MonsterKind.TUMANNIK`.
- No old `fog_sborka` id remains in spawn code.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
