# FLOOR_GEOMETRY_CONTRACT

Model: GPT-5.5
Reasoning: xhigh
Parallel role: shared contract for the geometry-first floor wave.

## Mission

Make each authored/story floor feel like it has its own structural grammar. Geometry comes first: room graph, corridors, landmarks, loops, chokepoints, shortcuts, vertical fantasy, hazards and sightlines. NPCs, quests and loot are only supporting proof that the geometry is playable.

Use this contract with `floor_01.md` ... `floor_21.md`. The older `floorNN_name.md` prompts are historical content prompts.

## Mandatory Preflight

1. Read `README.md`, especially the floor map and authored design-floor sections.
2. Read `architecture.md`, especially generator ownership and the floor matrix.
3. Read `Docs/DesignFloors/floor_contract.md`.
4. Read the floor's old brief under `Docs/DesignFloors/<id>.md`.
5. Read the relevant source generator under `src/gen/` before editing.
6. Create or update `Docs/Tasks/Status_FLOOR##_GEOMETRY.md`.
7. Append final notes to `Docs/AgentLogs/LOG_FLOOR##_GEOMETRY.md`.

## Parallel Write Rules

- Stay in the floor you own. Do not edit another floor's generator.
- Do not add a new `FloorLevel` enum value.
- Do not edit `main.ts`, save/load, route data, renderer core, or shared systems for one floor's taste.
- Prefer local helpers inside the owned floor module or folder.
- For routed design floors, prefer `src/gen/design_floors/<id>.ts`. If a route-specific expansion currently lives in `src/gen/design_floors/full_floor.ts`, either keep your work local and document the needed integration step, or make only the smallest isolated call-out for your route.
- For story floors, work inside the existing `src/gen/<floor>/` folder and protect existing story rooms/POIs.
- Do not add frameworks, asset pipelines, imported UI kits, physics engines or runtime dependencies.

## Geometry Acceptance

A finished floor must satisfy all of these:

- Spawn shows one landmark, one route choice and one risk or shelter within the first 20 cells.
- The floor has a recognizable macro-shape, not just rectangular rooms connected by random corridors.
- There are at least three repeated structural motifs unique to this floor.
- There are loops, alternate routes and chokepoints. Avoid pure trees and avoid open empty planes.
- Normal lift/exit cells remain reachable from spawn after generation and after `ensureConnectivity`.
- Protected story rooms, named POIs, containers and debug entry paths are not erased.
- Samosbor/fog/hazards have readable shelter or flee geometry.
- No per-frame full-world scans, hot-loop allocations, DOM work or JSON work.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2` for toroidal math.

## Implementation Shape

Prefer one of these:

```txt
src/gen/design_floors/<id>.ts        routed authored floor
src/gen/<story_floor>/geometry.ts    story floor helper
src/gen/<story_floor>/index.ts       only when the generator itself owns the topology
```

Keep content modules as content modules. Do not move broad gameplay decisions into render, core or `main.ts`.

## Required Report

In the status/log files, include:

- changed files;
- macro-geometry description in one paragraph;
- approximate counts for rooms, landmarks, exits, loops/chokepoints if easy to measure;
- any central integration step intentionally deferred;
- validation commands run and real results.

## Validation

Run `npm run check` for geometry/generation changes. If blocked, run at least `npm run typecheck` and state why the full check was skipped. If render/light/sky behavior changed, run the game or smoke test and visually check for blank canvas, unreadable darkness, clipping and bad spawn framing.
