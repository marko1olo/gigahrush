# Addmonster 05: Жижевая женщина

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

No humanoid toxic slime monster. The game has slime systems and an old `black_slime_eye` registry entry, but not a mobile slime-bodied humanoid that uses water/sewer routes.

## Gameplay Role

Rare water/sewer predator and sample source. It should bridge slime cleanup, water routes, and social horror without becoming a joke character.

Player decision: avoid water, lure onto dry concrete, use absorbent/salt/UV/fire, or risk collecting a high-value slime sample.

## Visual And Sprite Plan

- New sprite file: `src/entities/slime_woman.ts`.
- Use game-facing name `Жижевая женщина`; keep `Жижа-тян` only as rumor slang.
- Silhouette: tall humanoid, horn-like head growths, dripping arms, lower body sometimes legs, sometimes tendrils.
- Palette: black/green toxic slime, cyan/white eyes, purple highlights from samosbor residue.
- Procedural generation:
  - Draw upper humanoid body with transparent-looking slime holes.
  - Random lower form: two unstable legs or one tendril skirt.
  - Drips as vertical 1px trails below arms/head.
  - Horns as curved dark-green protrusions.
- Slime-color states: black, white, blue-green.

## AI Plan

- New `MonsterKind.SLIME_WOMAN`.
- `slimeStrider` AI flag:
  - Faster in water/slime rooms.
  - Leaves a short-lived toxic floor mark on attack or when damaged.
  - Slower and more vulnerable on dry, lit concrete.
- Attack: melee grab plus small corrosion/needs drain if status hooks allow.
- Can move through water and narrow wet corridors; no wall phasing.
- Avoids strong UV if `uv_spotlight` is active.

## Generation And Reachability

- Maintenance water channels, slime rooms, flooded lab, black slime eyes area.
- Rare samosbor aftermath on `LIVING` if a bathroom/kitchen was breached.
- Add to slime sample contracts only after combat loop exists.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/slime_woman.ts`.
- `src/systems/ai/monster.ts`: `slimeStrider`, UV avoidance, residue drop.
- `src/systems/cell_hazards.ts` or existing slime hooks for short-lived toxic marks.
- `src/data/slime_defs.ts`: optional rare sample id.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `slime_humanoid_sampled`, `slime_humanoid_dried`.

## Counterplay

- Do not fight in water.
- Salt/absorbent or UV creates a dry window.
- Fire hurts but can make toxic steam if used in tight rooms.
- Sample collection after kill should take time or require container.

## Done

- Reads as slime humanoid, not normal NPC.
- Water/dry state changes behavior.
- Sampling is reachable and evented.

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
