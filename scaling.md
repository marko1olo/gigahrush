# Scaling Status: Current-Floor 1k-4096 Active Actor Runtime

## Goal

Selected 1024x1024 floors target thousands of live NPCs and monsters in one loaded toroidal world:

- minimum lively floor pressure: at least 1000 active AI actors;
- dense NPC, monster-heavy and mixed war floors: up to the shared 4096 active NPC+monster actor ceiling.

This does not mean rendering all entities or making every actor solve expensive decisions every frame. It means every live NPC/monster keeps an `AIState` and receives the active-floor AI pass every simulation frame. Expensive target, utility, noise and path questions are bounded by broadphase queries, cached ids, flow fields and actor-local cooldowns, not by player-distance tiers.

This document describes the loaded current world only. Off-floor A-Life identities are persistent records; current macro changes come from folded live state, deaths, saved overrides, caravans, contracts and faction/economy events. Future migration must be explicit and bounded. Off-floor floors are not hidden realtime simulations.

The shipped population baselines below are source facts from `src/data/population_profiles.ts`; content-registry counts belong in `README.md` and planning tradeoffs stay in `desdoc.md`.

## Shipped Population Profiles

Population numbers are data-driven in `src/data/population_profiles.ts`.

### `KVARTIRY`

`KVARTIRY_POPULATION_PROFILE` targets the riot floor with:

- 2381 citizens;
- 1349 wild residents/rioters;
- 238 liquidators.

All spawned residents have AI. Runtime caps use one shared 4096 active actor ceiling for NPCs and monsters, so faction mixes and authored/content actors compete for the same actor pool instead of separate NPC/monster buckets.

Each NPC population profile has a data-driven distribution profile. Initial placement and explicit event/reinforcement placement use independent floor-cell picks biased by room type, zone faction and smooth density noise, so riots remain dense without tile quotas, spawn buckets or checkerboard population guarantees.

Measured start population in the current build is about 4096 live AI actors before later reinforcements.

### `HELL`

`HELL_POPULATION_PROFILE` starts Hell with:

- 4200 monsters;
- 700 cultists;
- 100 liquidators.

All spawned actors have AI. Its shipped baseline reserves room under the shared 4096 active actor ceiling: 3387 monsters, 565 cultists and 80 liquidators before authored/content actors.

Measured start population in the current build is about 4096 live AI actors. Hell placement uses the shared smoothed coverage-stratified placement field over the full floor, with narrow zone/noise weights instead of direct arena-cell pileups.

### Procedural Floors

`PROCEDURAL_POPULATION_PROFILE` scales by danger and floor conditions. The current procedural floor deck has 10 geometry profiles, 5 majority-faction profiles and 19 anomaly profiles:

- normal procedural NPCs: base 260, danger scaling 150, anomaly-pressure scaling 80, band bonus 0/120/220/0, cap 1250;
- normal procedural monsters: base 120, danger scaling 110, anomaly-pressure scaling 70, band bonus 0/80/140/220, industrial bonus 70, cap 1100;
- high-density `zombie_apocalypse` NPCs: base 3400, danger scaling 180, anomaly-pressure scaling 140, band bonus 0/160/300/0, local cap 4096 before fitting;
- high-density `zombie_apocalypse` monsters: base 260, danger scaling 130, anomaly-pressure scaling 90, band bonus 0/80/160/240, industrial bonus 80, cap 1500.

A high-density danger-5 procedural floor fits its NPC and monster targets into the same 4096 active actor ceiling. Ordinary procedural floors are intentionally lighter, with pressure coming from danger, anomaly profile, industrial geometry and route band rather than a universal max-density baseline. Procedural NPCs use the shared smoothed coverage-stratified whole-floor placement field instead of repeatedly picking random rooms. Zombie apocalypse floors keep a dense resident crowd and zombie pressure within that shared ceiling; patient zero uses an available monster slot or upgrades an existing generated zombie.

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

### Active AI Pass

All AI actors remain active. `updateAI()` iterates the indexed live-AI list once per simulation frame and keeps:

- NPC A-Life state/task primed;
- moving idle monsters normalized to wander;
- NPC fight/flee before routine utility;
- monster combat through the shared simple target/move/hit-or-shoot step;
- cached target scans through `combatTargetId` / `combatScanCd`;
- NPC utility rescoring on stable actor-local rethink timers while current intents execute every frame;
- physical projectile, HP, blood, death, drop and event consequences for fights anywhere on the active floor.

This keeps the full-floor simulation isotropic: rendering proximity affects visibility, not whether an actor thinks. Frame-time growth is controlled by cheap per-actor steps and bounded local queries rather than global hot/warm/cold gates.

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
SMOKE_SCENARIO=stress SMOKE_STRESS_ENTITIES=4096 SMOKE_PERF_FRAMES=300 npm run smoke
```

`SMOKE_STRESS_ENTITIES` is a target live-AI count, not an extra count on top of the current floor. The smoke hook spawns only the missing amount and verifies that the target is reached. Spawned stress actors all have AI.

Current measured browser smoke results:

- normal smoke, 300 frames: p95 about 25 ms;
- stress target 4096 live AI is the current smoke target after the power-of-two cap pass. Refresh this line with a local smoke measurement after the next browser performance run.

Stress fails if canvas/WebGL blanks, target live AI is not reached, p95 exceeds the configured target threshold, or max frame time exceeds 200 ms.

## Remaining Risks

These systems can still become bottlenecks in special encounters:

- faction/samosbor/debug summaries that intentionally count the full entity array;
- rail trains and cell hazards when many hazards/trains are active together;
- quest/debug/UI screens that show global data by design;
- very large local fights inside one small spatial-index neighborhood.

Those paths should stay low-frequency, debug-only, or move to cached/index-backed summaries when they become player-facing at high density.
