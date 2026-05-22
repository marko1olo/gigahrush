# Addmonster 17: Паупсина

## Source

- https://samosbor.shoutwiki.com/wiki/Паупсина

## Current Coverage

`Лифтовая арахна` exists as a rare shaft ambush, but Паупсина is a broader spider-like creature used by humans, with wild specimens being dangerous. It should not duplicate the lift encounter.

## Gameplay Role

Wild or trained web-spitter. In friendly hands, it can be a faction asset; wild versions are fast control enemies that immobilize rather than simply bite.

Player decision: avoid webbed room, cut/burn web, capture/report trained specimen, or fight wild one.

## Visual And Sprite Plan

- New sprite file: `src/entities/paupsina.ts`.
- Silhouette: many-legged low body, large front fangs, abdomen web sac, alert posture.
- Palette: black/brown chitin, pale web sac, toxic green fang tips, red small eyes.
- Procedural generation:
  - Draw oval body plus abdomen.
  - 6 to 8 thin legs radiating with joint pixels.
  - Web sac as pale rear oval with thread lines.
  - Wild package has broken harness; a future trained package can have small armband/collar pixels.
- Must read smaller/faster than lift arachna.

## AI Plan

- New `MonsterKind.PAUPSINA`.
- `webSpitter` AI flag:
  - Medium-range web projectile or short cone.
  - Web applies slow/root for a short duration, not full stun lock.
  - Moves around target to maintain range.
- Friendly/trained use later can be NPC/faction content. First pass should only add wild monster and web mechanics.
- Fire/cutting frees web faster.

## Generation And Reachability

- Maintenance, abandoned service rooms, militia/party storage accidents.
- Rare in `KVARTIRY` if a trained one escaped.
- Place web marks before monster contact.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/paupsina.ts`.
- `src/systems/ai/monster.ts`: web ranged behavior.
- `src/systems/status.ts`: short web slow/root status.
- `src/render/marks.ts`: web floor/wall mark if needed.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- `src/systems/events.ts`: `paupsina_webbed`, `paupsina_web_cut`.
- Tests: web cooldown and max slow duration.

## Counterplay

- Burn/cut web before entering.
- Keep cover between spits.
- Shotgun punishes close jump.
- A trained/friendly package should not be attacked blindly if later added.

## Done

- Web status is capped and escapable.
- Wild паупсина has distinct role from lift arachna.
- Web marks give warning.

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
