# Procedural Floor Anomaly Contract

This document is for agents adding new procedural floor anomaly profiles.

## Current Entry Points

- Definitions: `src/data/procedural_floors.ts`
- Built-in application code: `src/gen/procedural_floor.ts`
- Profile modules: `src/gen/procedural_anomalies/`
- Runtime hooks: `src/systems/procedural_anomalies.ts`, `src/systems/procedural_anomalies/`, `src/systems/hladon.ts`, `src/systems/rail_trains.ts`
- Runtime sparse topology/state: `World.anomalyTeleports`, `World.anomalySmog*`, `World.railTracks`, `World.railTrains`, room-name tags and dirty flags
- Route/save state: `src/systems/procedural_floors.ts`

Do not create a new event bus or renderer-owned gameplay state for an anomaly. Use existing world arrays, sparse maps and `systems/events.ts` if the anomaly needs public facts.

## What An Anomaly Profile Is

An anomaly profile is data that modifies an otherwise normal procedural floor:

- `id`: lowercase snake case, stable.
- `title`: short Russian HUD/debug title.
- `weight`: relative chance.
- `minDanger`: minimum danger level before it can appear.
- `dangerBias`: danger modifier after selection.
- `tags`: hooks for loot, monsters, contracts, rumors and screens.

## Existing Profiles

Source count: 20 profiles in `FLOOR_ANOMALIES`.

- `none` - tags: none; runtime/rebuild: normal procedural floor with no anomaly-specific generator or runtime hook.
- `smog` - tags: `fog`, `visibility`, `smog`, `govnyak`, `contraband`; runtime/rebuild: generation writes bounded fog cells, `world.anomalySmogSource`, `world.anomalySmogCells` and a source apparatus; runtime pressure/counterplay lives in `src/systems/procedural_anomalies.ts` and must stay tied to the current `World`/`GameState`, not renderer state.
- `teleport_cells` - tags: `topology`; runtime/rebuild: generation creates symmetric sparse pairs in `world.anomalyTeleports` and screen markers; interaction can consume a counter item to delete one pair, so every added pair must stay bidirectional and avoid protected cells.
- `mushroom_mycelium` - tags: `mushroom`, `food`, `slime`; runtime/rebuild: generation builds a bounded Gray-Scott proxy field, marks reachable rooms and root corridors with visible mycelium/fog/splats, adds contaminated food and spore basins, seeds fungal monster anchors and can still decorate carnivorous fungus rooms; no dedicated anomaly tick is required.
- `hladon` - tags: `cold`, `heat_counter`, `route_pressure`; runtime/rebuild: generation names cold rooms with the `Хладон:` prefix and adds frost, fog and warm counterplay drops; runtime cold masks are cached per `World` in `src/systems/hladon.ts` and rebuilt from room names after floor rebuilds.
- `false_safe_block` - tags: `cult`, `shelter`, `false_safe_block`; runtime/rebuild: generation creates a clean shelter room, nearby quiet corridors, cult containers, screen/apparatus evidence and caretakers; runtime discovery/resolution is stored through room-name flags, container discovery and events.
- `mirror_run` - tags: `mirror`, `duality`, `teleport`, `loot`; runtime/rebuild: generation decorates mirrored room pairs, drops paired loot and adds limited `world.anomalyTeleports` links; no dedicated tick, but topology pairs must stay sparse and symmetric.
- `radio_chess` - tags: `pattern`, `radio`, `timing`, `movement`; runtime/rebuild: generation names board rooms and places beacons; runtime phase damage and beacon toggles use bounded caches keyed by `World`/`GameState`.
- `conveyor_sorter` - tags: `conveyor`, `items`, `industrial`, `movement`; runtime/rebuild: generation names conveyor rooms, paints loops/item lanes/side belts and places controls/receivers; runtime pushes only the player on cached loop/lane cells every 0.35s and supports a temporary control shutdown.
- `fractal_floor` - tags: `fractal`, `maze`, `topology`, `documents`; runtime/rebuild: generation stamps a bounded fractal domain, copy rooms, loot and limited teleports; it must not carve through spawn/lifts/protected cells or isolate route-critical space.
- `cement_memory` - tags: `trail`, `pressure`, `no_backtracking`, `samosbor`; runtime/rebuild: generation marks amnesia rooms and panels; runtime records a fixed-size ring of recent player cells, ages marks once per second and lets panels clear recent trail pressure.
- `wall_snake` - tags: `moving_walls`, `predator`, `crush`, `loot_sink`; runtime/rebuild: generation stores one perimeter path in the room name and places bait; runtime uses fixed typed arrays to move a wall body and restore tail cells, with bait shortening/stopping the snake.
- `living_tunnels` - tags: `living_tunnels`, `topology`, `moving_walls`, `repair`, `route_pressure`; runtime/rebuild: generation seeds multiple root apparatuses and capillary scars across ordinary procedural rooms, protects lift anchors and stores root descriptors in room names; runtime advances bounded tendrils every 0.42s, carves only small patches, restores old tail cell snapshots and lets sealant, jackhammer or UV pause a local root or fresh cut.
- `rail_trains` - tags: `rail`, `transit`, `crush`, `industrial`; runtime/rebuild: generation carves rail beds/platforms and registers `world.railTracks` plus train entities; `src/systems/rail_trains.ts` owns motion, boarding, collisions and train-cell maps.
- `bad_apple_world` - tags: `video`, `screen`, `topology`, `cult_media`; runtime/rebuild: generation stamps a 144x108 Bad Apple room connected from spawn; runtime frame animation mutates wall/floor cells from cached screen descriptors and projector interaction toggles the animation.
- `zombie_apocalypse` - tags: `zombie`, `crowd`, `infection`, `quarantine`, `residential`; runtime/rebuild: generation is active only where procedural NPCs are allowed, seeds a dense civilian crowd and patient zero, and converts shadow spawns to zombies; runtime infection converts NPCs through the entity index and publishes outbreak events.
- `sandpile_perekrytie` - tags: `topology`, `crush`, `pressure`, `industrial`, `route_pressure`; runtime/rebuild: generation tags bounded unstable slab arenas with Abelian-sandpile stress marks, a safe rim, a brittle wall seam and stabilizer supplies; runtime interaction can trigger a warned local collapse that opens the seam while turning unstable slab cells into abyss, or stabilize it from the apparatus. Lift/button buffers, protected cells, doors and containers are skipped, and collapsed cells persist through normal world snapshots.
- `section_shift` - tags: `topology`, `moving_rooms`, `crush`, `toroid`; runtime/rebuild: generation writes section bounds into room names and places apparatus controls; runtime teleports the player within the same bounded section after warnings and can freeze a section temporarily.
- `conway_life` - tags: `cellular`, `topology`, `moving_walls`, `math`; runtime/rebuild: generation names bounded arenas and seeds wall/floor cells plus freeze/reset controls; runtime ticks B3/S23 every 0.75s using per-arena typed masks and protects doors, lifts, containers and cells near the player.
- `samosbor_seed` - tags: `samosbor`, `meat`, `slime`; runtime/rebuild: generation adds fog, meat/gut floor marks and samosbor-zone pressure; route timers treat it as high samosbor pressure through `adjustFloorRunSamosborTimer`.

## Runtime And Rebuild Constraints

- `FloorAnomalyId` values are save-bearing. `normalizeFloorRunState()` accepts only ids present in `FLOOR_ANOMALIES`; renaming or removing an id invalidates saved specs unless normalization is intentionally updated.
- Specs are generated once per run seed and z-slot, then reused by route/save state. A floor rebuild must be able to recreate the anomaly from `spec.seed`, `spec.anomalyId`, world cells, sparse maps and room-name tags.
- Runtime caches must be bounded and disposable. Prefer `WeakMap<World, ...>` or `WeakMap<GameState, ...>` caches that rebuild from the current world; do not put anomaly gameplay state in the renderer.
- Late topology changes run after rooms, zones, lifts, loot and spawns. They must preserve spawn safety, lift cells/buttons, protected cells, container maps, doors near controls, and a reachable route between spawn and both lift directions.
- If an anomaly mutates `cells`, `wallTex`, `floorTex`, `fog`, `light` or containers after generation, mark the matching dirty flags and rebuild sparse maps when required.

## Adding An Anomaly

1. Add the id to `FloorAnomalyId`.
2. Add a `FloorAnomalyDef` to `FLOOR_ANOMALIES`.
3. Add loot/monster tag entries if the anomaly changes spawn weights.
4. Add a small built-in branch in `src/gen/procedural_floor.ts` or a focused module under `src/gen/procedural_anomalies/` and wire it through `index.ts`.
5. If it has a runtime effect, wire a bounded update/interaction hook through `src/systems/procedural_anomalies.ts` or an existing system such as `hladon` or `rail_trains`.
6. Add event tags/data in `proceduralAnomalyEventTags()` / `proceduralAnomalyEventData()` when facts should feed rumors, net summaries or context.
7. Keep runtime behavior bounded: cooldowns, sparse maps, radius caps, fixed-size buffers or generation-time state.
8. Publish a `WorldEvent` only when the player or simulation needs to remember it.

## Good Anomaly Effects

- Changes route topology: paired cells, one-way shortcuts, sealed pockets.
- Changes visibility: fog, light failure, screen noise.
- Changes risk: monster bias, zone faction, samosbor pressure.
- Changes loot: unique item bias, contaminated supplies, faction caches.
- Gives a decision: avoid, exploit, loot, repair, expose, flee.

## Rules

- No full-world per-frame scans.
- No DOM UI.
- No new texture atlas entries unless existing `Tex` ids cannot express the effect.
- Do not make an anomaly a hidden instant death.
- Do not make an anomaly depend on a named story room or NPC.

## Validation

For docs/source sync, run:

```bash
npm run content:audit
```

The audit compares the ids listed under `Existing Profiles` with `FLOOR_ANOMALIES`.

For anomaly implementation changes, also verify:

- The generated floor remains reachable from spawn to up/down lift after all anomaly code runs, especially for `bad_apple_world`, `conway_life`, `fractal_floor`, `living_tunnels`, `rail_trains`, `section_shift`, `teleport_cells` and `wall_snake`.
- Runtime caches reset or rebuild after floor transitions, save/load and samosbor rebuilds.
- Interactions are reachable through HUD look targeting and have counterplay or an explicit decision.
- Dirty flags and sparse maps are updated after cell, fog, texture, light or container mutations.

For runtime movement, rendering, save/load or generator changes, run:

```bash
npm run check
```
