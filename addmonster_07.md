# Addmonster 07: Псевдолифт

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

Elevators and lift arachna exist, but no lift mimic. This should not replace normal lift travel; it should be a rare readable trap with strong counterplay.

## Gameplay Role

Route-choice monster. It mimics a lift cabin, lures the player into a false transition, then becomes a confined fight or escape check.

Player decision: inspect lift cues, use a known route, throw bait/item first, or risk the fast route.

## Visual And Sprite Plan

- This is partly a world feature and partly a monster.
- New sprite file: `src/entities/pseudolift.ts` for revealed form.
- Revealed silhouette: rectangular elevator mouth, folding metal ribs, wet red-black interior, cable-tongue.
- Palette: old lift metal, yellow lamp, black mouth, red gum seams.
- Procedural generation:
  - Draw lift-door rectangle with asymmetry and too many inner vertical teeth.
  - Add small fake floor-number display.
  - Revealed state opens center as black maw with cable tendrils.
- World cue before reveal: door texture mismatch, wrong floor label, damp threshold.

## AI Plan

- New `MonsterKind.PSEUDOLIFT` plus a sparse lift-mimic registry, not random roaming.
- Dormant state:
  - Occupies a lift-adjacent cell/room marker.
  - Interaction tries to "enter"; if cues ignored, reveal.
- Revealed state:
  - Short-range grab, high damage in doorway.
  - Cannot chase far. If player exits the lift bay, it snaps shut and goes dormant/escaped.
- Consumes dropped item/bait to reveal safely, giving a route around or fight opening.

## Generation And Reachability

- Rare on procedural route floors, dark metro/service floors, and post-samosbor lift anomalies.
- Do not spawn on required only exit unless alternate route exists.
- Debug route: spawn fake lift marker near player.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/pseudolift.ts`.
- `src/systems/interactions.ts`: inspect/enter branch before floor transition.
- `src/systems/procedural_floors.ts` or lift anomaly state: sparse mimic registry.
- `src/systems/events.ts`: `pseudolift_suspected`, `pseudolift_revealed`, `pseudolift_fed`.
- `src/render/hud.ts`: short prompt when looking at suspicious lift.
- Tests: cannot be only route blocker; item reveal works.

## Counterplay

- Inspect wrong signage/damp threshold.
- Throw junk or food into the lift first.
- Back out of the bay rather than fighting inside.
- Fire/cutting weapons work after reveal.

## Done

- Normal lifts remain reliable most of the time.
- Trap is rare, readable, and avoidable.
- It never softlocks route progression.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
