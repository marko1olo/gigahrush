# Scaling Status: 1k-10k Active AI Per Current World

## Goal

Selected 1024x1024 floors now target thousands of live NPCs and monsters in one loaded toroidal world:

- minimum lively floor pressure: at least 1000 active AI actors;
- normal dense floors: about 5000 active AI actors;
- stress/dense ceiling: about 10000 active AI actors.

This does not mean rendering all entities or running every actor at browser frame rate. It means every live NPC/monster keeps an `AIState` and remains in simulation. Near-player actors and active threats are updated every frame; far actors update on deterministic accumulated cadences, so AI is not disabled in distant areas.

## Shipped Population Profiles

Population numbers are data-driven in `src/data/population_profiles.ts`.

### `KVARTIRY`

`KVARTIRY_POPULATION_PROFILE` starts the riot floor with:

- 3000 citizens;
- 1700 wild residents/rioters;
- 400 liquidators.

All spawned residents have AI. Runtime caps are 6000 citizens, 3200 wild and 800 liquidators, with a total active-population ceiling of 10000.

Each NPC bucket has a data-driven distribution profile. Starting and refill placement uses independent floor-cell picks biased by room type, zone faction and smooth density noise; the remainder still spawns as local groups, so riots remain dense without forcing tile quotas or checkerboard population guarantees.

Measured start population in the current build is about 5100 live AI actors before later reinforcements.

### `HELL`

`HELL_POPULATION_PROFILE` starts Hell with:

- 4200 monsters;
- 700 cultists;
- 100 liquidators.

All spawned actors have AI. Runtime caps are 8200 monsters, 1500 cultists and 300 liquidators, with a roughly 10000 active-population ceiling.

Measured start population in the current build is about 5000 live AI actors.

### Procedural Floors

`PROCEDURAL_POPULATION_PROFILE` scales by danger and floor conditions:

- NPC base 3500, danger scaling 300, cap 5000;
- monster base 350, danger scaling 180, cap 1500;
- deep, industrial and anomaly pressure bonuses.

A danger-5 procedural floor generates about 6500 live AI actors. Zombie apocalypse floors generate roughly 10000 active resident NPCs plus patient-zero pressure; the former inactive crowd cap was removed.

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

- near-player actors hot every frame;
- actors targeting the player hot inside the player-relevant bubble;
- windup/stagger actors hot;
- far routine actors on deterministic accumulated cadences;
- far combat actors active on a faster cadence than routine actors.

This keeps the full-floor simulation alive without making far residents and monsters pay frame-rate costs.

### Pathfinding Budget

Routine pathfinding already used preallocated BFS buffers and a token budget. Combat chase paths, monster bait chase and Kostorez chase now use the same budgeted path assignment instead of launching unbounded BFS waves when thousands of actors fight at once.

Path cache entries persist across frames until the world cell version changes, and cached path arrays are shared read-only by actors through their own `ai.pi` path cursor.

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
- stress target 5000 live AI, 300 frames: p95 about 25 ms;
- stress target 10000 live AI, 300 frames: p95 about 26 ms, max under 60 ms on the tested machine.

Stress fails if canvas/WebGL blanks, target live AI is not reached, p95 exceeds the configured target threshold, or max frame time exceeds 200 ms.

## Remaining Risks

The 10k path is now playable in smoke, but these systems can still become bottlenecks in special encounters:

- faction/samosbor/debug summaries that intentionally count the full entity array;
- rail trains and cell hazards when many hazards/trains are active together;
- quest/debug/UI screens that show global data by design;
- very large local fights inside one small bucket neighborhood.

Those paths should stay low-frequency, debug-only, or move to cached/index-backed summaries when they become player-facing at 10k density.
