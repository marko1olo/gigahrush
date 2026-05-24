# Scaling Status: Current-Floor 1k-5k NPC / 10k Monster Runtime

## Goal

Selected 1024x1024 floors target thousands of live NPCs and monsters in one loaded toroidal world:

- minimum lively floor pressure: at least 1000 active AI actors;
- dense NPC floors: up to the shared 5000-NPC ceiling;
- monster-heavy floors and stress runs: up to the shared 10000-monster ceiling.

This does not mean rendering all entities or running every actor at browser frame rate. It means every live NPC/monster keeps an `AIState` and remains in simulation. Near-player actors and active threats are updated every frame; far actors update on deterministic accumulated cadences, so AI is not disabled in distant areas.

This document describes the loaded current world only. Off-floor A-Life identities are persistent records and may change through bounded aggregate events, migrations, caravans or quests, but they are not hidden realtime floor simulations.

The shipped population baselines below are source facts from `src/data/population_profiles.ts`; content-registry counts belong in `README.md` and planning tradeoffs stay in `desdoc.md`.

## Shipped Population Profiles

Population numbers are data-driven in `src/data/population_profiles.ts`.

### `KVARTIRY`

`KVARTIRY_POPULATION_PROFILE` starts the riot floor with:

- 3000 citizens;
- 1700 wild residents/rioters;
- 400 liquidators.

All spawned residents have AI. Runtime caps are 6000 citizens, 3200 wild and 800 liquidators, inside the shared 5000-NPC ceiling.

Each NPC population profile has a data-driven distribution profile. Initial placement and explicit event/reinforcement placement use independent floor-cell picks biased by room type, zone faction and smooth density noise, so riots remain dense without tile quotas, spawn buckets or checkerboard population guarantees.

Measured start population in the current build is about 5000 live AI actors before later reinforcements.

### `HELL`

`HELL_POPULATION_PROFILE` starts Hell with:

- 4200 monsters;
- 700 cultists;
- 100 liquidators.

All spawned actors have AI. Runtime caps are 8200 monsters, 1500 cultists and 300 liquidators, inside the shared 10000-monster and 5000-NPC ceilings.

Measured start population in the current build is about 5000 live AI actors. Hell placement uses the shared smoothed coverage-stratified placement field over the full floor, with narrow zone/noise weights instead of direct arena-cell pileups.

### Procedural Floors

`PROCEDURAL_POPULATION_PROFILE` scales by danger and floor conditions. The current procedural floor deck has 10 geometry profiles, 5 majority-faction profiles and 19 anomaly profiles:

- NPC base 3500, danger scaling 300, cap 5000;
- monster base 350, danger scaling 180, cap 1500;
- deep, industrial and anomaly pressure bonuses.

A danger-5 procedural floor can generate about 6500 live AI actors: up to 5000 NPCs plus up to 1500 monsters. Procedural NPCs use the shared smoothed coverage-stratified whole-floor placement field instead of repeatedly picking random rooms. Zombie apocalypse floors use the same 5000-NPC ceiling plus patient-zero pressure; the former independent 9000+ crowd burst was removed.

### `VOID`

`VOID_POPULATION_PROFILE` uses about 1600 active guardians and sparse loot. `generateFloor(FloorLevel.VOID)` still strips NPCs, so route-facing endgame Void remains NPC-free while monsters and protocols stay active.

## Engine Changes

### Entity Index

`src/systems/entity_index.ts` is the runtime broadphase:

- 16x16 toroidal spatial buckets over the 1024x1024 map;
- `byId` map for live entities;
- live `actors`, `ai`, `needs` and `projectiles` lists;
- radius queries with type masks for player/NPC/monster/item/projectile filters.

The index is rebuilt after floor loading and once per frame before rendering, then reused by simulation systems. Local systems no longer scan the full `entities` array for target acquisition, projectile hits, AoE, sprite collection, map pips or interaction prompts.

### Active AI Cadence

All AI actors remain active. `updateAI()` iterates the indexed live-AI list and keeps:

- NPC A-Life state/task primed before cadence skips;
- moving idle monsters normalized to wander;
- near-player actors hot every frame;
- actors targeting the player hot inside the player-relevant bubble;
- windup/stagger actors hot;
- far active-attacker, projectile-owner and recent-damage hot promotions capped by `AI_LOD_SCHEDULER_PROFILE.hotPromotionCaps`;
- far routine actors on deterministic accumulated cadences;
- far combat actors active on a faster cadence than routine actors.

This keeps the full-floor simulation alive without making far residents and monsters pay frame-rate costs.

### Baked Navigation

Routine and combat pathfinding use a baked whole-floor BFS navigation tree in `src/systems/ai/pathfinding.ts`. The tree covers the 1024x1024 toroidal field once per geometry/samosbor version, treats ordinary closed doors as openable route cells, and excludes locked or hermetic-closed doors.

Actors receive bounded path chunks from the baked tree and continue from `ai.tx/ai.ty` when a chunk ends. There is no routine path token queue and no per-actor BFS wave during normal AI assignment.

Common A-Life goals also use behavior flow fields keyed by target source sets. A behavior such as "go to any kitchen" or "go to any valid workplace room" bakes one whole-floor field, then every actor for that behavior follows the field in bounded chunks. New reusable behaviors should add a source provider or room-type source set and reuse this layer instead of launching per-NPC searches.

### Slow Global Systems

The following recurring full scans were removed or reduced:

- `updateNeeds()` uses indexed needs actors and ticks at slow accumulated cadence.
- `updateBloodTrails()` uses indexed actors and ticks at slow accumulated cadence.
- `updatePsiEffects()` avoids scanning all actors every frame when there is no active madness/control effect.
- dead-entity cleanup runs periodically instead of scanning every frame.
- HUD aim/interaction and map entity dots use entity-index radius queries.
- mobile interaction checks are skipped when mobile controls are disabled.

## Stress Harness

`scripts/smoke-playability.mjs` supports target-total stress:

```bash
SMOKE_SCENARIO=stress SMOKE_STRESS_ENTITIES=5000 SMOKE_PERF_FRAMES=300 npm run smoke
SMOKE_SCENARIO=stress SMOKE_STRESS_ENTITIES=10000 SMOKE_PERF_FRAMES=300 npm run smoke
```

`SMOKE_STRESS_ENTITIES` is a target live-AI count, not an extra count on top of the current floor. The smoke hook spawns only the missing amount and verifies that the target is reached. Spawned stress actors all have AI.

Current measured browser smoke results:

- normal smoke, 300 frames: p95 about 25 ms;
- stress target 5000 live AI, 300 frames: avg 19.14 ms, p95 25.10 ms, max 42.00 ms on the 2026-05-20 local smoke run.
- forced zombie apocalypse procedural floor, 60 AI frames in Node: about 6046 live AI, avg 19.68 ms, p95 25.15 ms, max 44.49 ms on the 2026-05-20 local profile run.

Stress fails if canvas/WebGL blanks, target live AI is not reached, p95 exceeds the configured target threshold, or max frame time exceeds 200 ms.

## Remaining Risks

These systems can still become bottlenecks in special encounters:

- faction/samosbor/debug summaries that intentionally count the full entity array;
- rail trains and cell hazards when many hazards/trains are active together;
- quest/debug/UI screens that show global data by design;
- very large local fights inside one small spatial-index neighborhood.

Those paths should stay low-frequency, debug-only, or move to cached/index-backed summaries when they become player-facing at high density.
