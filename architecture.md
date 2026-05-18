# GIGAHRUSH Modular Architecture

Purpose: turn the current TypeScript/Vite raycaster game into a content factory where many agents can add rooms, NPCs, quests, events, monsters, documents, economy hooks, and floor variants without fighting over the same files.

This document is based on the current code, `README.md`, and `desdoc.md` as of 2026-05-17. It is not a rewrite plan. The project is already playable; architecture work must protect that.

## 1. Current Fact Map

The real project shape is:

```txt
src/
  core/       low-level constants, enums, World, shared state shapes
  data/       definition registries: items, weapons, plot, notes, relations, variants
  entities/   monster definitions and procedural sprite generators
  gen/        floor generators and hand-made content modules
  systems/    runtime logic: AI, quests, samosbor, factions, events, inventory
  render/     raycaster/WebGL/HUD/map/log rendering
  input.ts    input state
  main.ts     browser entry point, game loop, floor switching
```

Critical runtime facts:

- `World` is data-oriented: packed `Uint8Array`, `Int16Array`, `Float32Array`, sparse maps only where needed.
- `entities` is a flat array of plain objects with optional component fields. There are no entity subclasses.
- The world is a 1024x1024 torus. All coordinate work must use `world.idx`, `world.wrap`, `world.delta`, or `world.dist`.
- Floor generators return `{ world, entities, spawnX, spawnY }`.
- Normal lift travel uses `systems/procedural_floors.ts` as a per-run vertical route. Existing `FloorLevel` values remain story/base floors; authored design floors are string-id route stops from `src/data/design_floors.ts`; procedural interstitial floors are string-id specs with `z`, seed, geometry, main faction, anomaly and danger.
- `main.ts` owns the game loop and calls systems in fixed order.
- `systems/events.ts` is the current EventBus analogue: fixed-size ring buffers, public event publication, and query filters.
- Existing content extensibility already exists in `registerSideQuest`, `registerZoneContent`, `SAMOSBOR_VARIANTS`, `PLOT_NPCS`, and module-level floor content files.

## 2. Non-Negotiable Invariants

These are the rules every new module must preserve.

- No new runtime dependency unless there is a measurable reason and an owner for integration.
- No large refactor before content delivery.
- No content-specific logic in `main.ts`, `core/world.ts`, `render/webgl.ts`, or `systems/ai/index.ts`.
- No direct dependency on another agent's unmerged module. Communicate through ids, registries, or `publishEvent`.
- No per-frame content scanning unless bounded by cooldown, radius, cap, or ring buffer.
- No coordinate math that ignores toroidal wrap.
- No generator that seals a room without proving it is reachable.
- No permanent POI on LIVING without `aptMask` protection and a corridor/door connection.
- README is implementation fact. `desdoc.md` is roadmap and tone. This file is the engineering contract.

## 3. Layer Contract

The project should stay in five layers.

```txt
Definitions  ->  Generation  ->  Runtime Systems  ->  Render/UI
       \              \              /
        \              Event Store  /
         Core Types + World Arrays
```

`core/`

- Owns primitive shape only: enums, interfaces, `World`, constants.
- Changes here are cross-project changes. They require an integration task.
- Prefer string ids in new definitions before adding enums.

`data/`

- Owns declarative content: ids, weights, rewards, text, spawn rules, prices, recipes, variants.
- No world mutation here.
- No frame logic here.
- Definitions should be plain objects or readonly arrays.

`gen/`

- Owns construction: rooms, corridors, POIs, initial NPC/item placement, floor-specific content.
- Content modules mutate `World` once during generation or samosbor rebuild.
- Agents should mostly add new files here.

`systems/`

- Owns generic runtime behavior.
- Systems must consume definitions, not hardcode one module.
- Systems must publish important state changes through `publishEvent`.

`render/`

- Reads state and draws.
- Visual feature additions should be data-indexed: texture id, sprite id, mark type, HUD flag.
- Do not put gameplay decisions here.

## 4. Parallel Agent Ownership

Use this to avoid file conflicts.

Green files, safe for one agent:

- New `src/gen/<floor>/<module>.ts`
- New `src/data/<domain>_<module>.ts` or a new small domain file
- New `src/entities/<monster>.ts`
- New docs under `Docs/`

Yellow files, edit only with a narrow reason:

- `src/gen/<floor>/index.ts` for one import/call
- `src/gen/<floor>/side_quests.ts` or equivalent local registry
- `src/data/items.ts`, `src/data/weapons.ts`, `src/data/plot.ts`
- `src/entities/monster.ts`
- `src/systems/debug.ts`

Red files, integrator-owned:

- `src/core/types.ts`
- `src/core/world.ts`
- `src/main.ts`
- `src/gen/shared.ts`
- `src/render/webgl.ts`
- `src/render/sprites.ts`
- `src/render/textures.ts`
- Broad AI, quest, inventory, or samosbor rewrites

If a task needs a red file, split it into:

1. Small API/hook change by one owner.
2. Additive content modules by everyone else.

## 5. Registry Pattern

Every expandable domain should follow one of these patterns.

Current examples:

- Side quests: module calls `registerSideQuest()` in `src/data/plot.ts`.
- LIVING zone POIs: module calls `registerZoneContent()` in `src/gen/living/zone_content.ts`.
- Samosbor variants: definitions live in `src/data/samosbor_variants.ts`, system consumes active variant.
- Events: systems call `publishEvent()`, consumers query ring buffers.

Standard shape for new registries:

```ts
export interface SomeDef {
  id: string;
  weight: number;
  tags: string[];
}

const registry: SomeDef[] = [];

export function registerSome(def: SomeDef): void {
  registry.push(def);
}

export function getSomeDefs(): readonly SomeDef[] {
  return registry;
}
```

Rules:

- Registry ids are lowercase snake case and globally meaningful: `living_radio_eye`, `maint_pressure_station`, `ministry_stamp_debt`.
- Module files own their local definitions and call register at top level.
- Runtime systems read registries once per tick window or generation phase, not every pixel/ray.
- If duplicate ids matter, the registry rejects them in development with `console.warn` or throws during generation.

## 6. Import Contention Fix

Current content often requires one side-effect import in a floor `index.ts`. That is acceptable for small batches, but it becomes a merge conflict with 20+ agents.

Short-term rule:

- One agent may add one import/call to an existing floor orchestrator.
- If more than three agents touch the same floor in one batch, create a local manifest.

Implemented manifests:

```txt
src/gen/floor_manifest.ts
src/gen/living/content_manifest.ts
src/gen/maintenance/content_manifest.ts
src/gen/ministry/content_manifest.ts
src/gen/kvartiry/content_manifest.ts
src/gen/hell/content_manifest.ts
src/gen/void/content_manifest.ts
```

The floor `index.ts` imports only its manifest or a small runner from it. Agents then append module imports or ordered runner entries to the manifest, not the orchestrator. The manifest remains the single conflict surface.

Current floor matrix:

| Floor | Generator | Additive Hook | Manifest Status | Shared-File Risk |
| --- | --- | --- | --- | --- |
| `MINISTRY` | `src/gen/ministry/index.ts` | `runMinistryContent()` | implemented | low; agents edit `content_manifest.ts` |
| `KVARTIRY` | `src/gen/kvartiry/index.ts` | named NPC and permanent content runners | implemented | medium; population update still lives in `index.ts` |
| `LIVING` | `src/gen/living/index.ts` | side-effect zone content + side quest spawners | implemented | medium; `side_quests.ts` remains ordered spawn registry |
| `MAINTENANCE` | `src/gen/maintenance/index.ts` | `runMaintenanceContent()` | implemented | low; mixed generator signatures hidden behind adapters |
| `HELL` | `src/gen/hell/index.ts` | `runHellContent()` | implemented | low; population update remains in `index.ts` |
| `VOID` | `src/gen/void/index.ts` | `runVoidContent()` | implemented | low; agents edit `content_manifest.ts` |

`src/gen/floor_manifest.ts` owns floor names, floor message colors, `FloorLevel -> generator`, and save/load generation. Adding a new story floor now starts there instead of duplicating switch logic in `main.ts` and `systems/samosbor.ts`.

`src/data/design_floors.ts` and `src/gen/design_floors/manifest.ts` own routed authored design floors without adding new `FloorLevel` enum values. `src/gen/design_floors/full_floor.ts` is the integration layer that expands small authored POI modules into full 1024x1024 route floors while keeping route-specific content out of `main.ts`. `src/data/procedural_floors.ts`, `src/systems/procedural_floors.ts`, and `src/gen/procedural_floor.ts` own interstitial procedural floors. Add new procedural geometry/anomaly profiles there or through their docs contracts; do not clone named story content into procedural floors.

Generic render hooks are allowed when a floor needs a reusable presentation channel. The roof uses this pattern: `src/gen/design_floors/roof.ts` exposes a 1024x1024 dynamic sky texture provider, and `src/render/webgl.ts` only owns the generic dynamic ceiling texture slot, not roof gameplay.

Later, if edit contention is still high, use Vite eager globs:

```ts
import.meta.glob('./content/**/*.ts', { eager: true });
```

That requires adding Vite import-meta types first. Do not introduce it casually; it is a build-contract change.

## 7. Data-Oriented Runtime Rules

The engine is already data-oriented. Keep it that way.

Use:

- Plain object definitions.
- Typed arrays on `World` for dense per-cell state.
- Flat entity arrays for NPCs, monsters, items, projectiles.
- Small sparse `Map`s only for rare per-cell data, such as doors or surface marks.
- Fixed-size ring buffers for history.
- Numeric ids and string ids, not object graphs.
- Slow accumulators for simulation: 0.5s, 1s, 5s, 30s depending on gameplay need.

Avoid:

- Per-module `setInterval`.
- Per-frame full-world scans.
- Per-entity closures allocated during updates.
- Deep class inheritance.
- JSON parse/stringify in the game loop.
- DOM work in systems.
- Renderer-side gameplay state.

Default budgets:

```txt
Content generation: can be expensive, but bounded and done on loading/rebuild.
Per-frame system: suspicious above 0.1 ms.
Slow system tick: target below 0.2 ms per second on i3/MX350.
HUD/render additions: draw from cached state, no world scans in draw calls.
```

## 8. Content Module Contract

Most content should be a self-contained file with four parts:

1. Local constants and ids.
2. Optional data registration: quest, NPC, event, room, document, economy def.
3. One generator/spawn function.
4. Optional debug/test hook.

For a generated POI:

- Pick a stable id.
- Choose a floor and zone.
- Bulldoze only non-protected cells.
- Set `cells`, `roomMap`, `wallTex`, `floorTex`, and `features`.
- Create `Room` records with real `RoomType`.
- Add doors to `world.doors` and `room.doors`.
- Protect permanent content with `aptMask` where required.
- Connect to an existing floor cell.
- Spawn NPCs/items with `nextId.v++`.
- Publish or register enough data for quests/map/debug to find it.

For a data-only module:

- Use a registry.
- Provide at least one path to visibility: loot spawn, trader, guaranteed room, debug command, quest, event, or document pool.
- Do not add dead data.

## 9. System Module Contract

New systems must be generic.

Good:

```txt
data/economy.ts       definitions: resources, recipes, price rules
systems/economy.ts    slow tick: production, shortage events, debug stats
gen/industry/*.ts     rooms that carry factory ids and spawn workers
```

Bad:

```txt
systems/economy.ts hardcodes one named room from one agent.
main.ts calls updateOneSpecificQuestRoom().
render/hud.ts scans every room to discover prices every frame.
```

Every new runtime system needs:

- A data file or registry.
- A bounded update cadence.
- A debug way to inspect it.
- Event publication for important changes.
- Save compatibility if it stores persistent state.
- A low-tier behavior that is cheap and a high-tier path that buys visuals/content, not raw simulation complexity.

## 10. Cross-System Communication

Use ids and events.

Preferred:

- `publishEvent(state, draft)` for things NPCs, rumors, quests, or UI may observe.
- Definition ids such as `factoryId`, `documentId`, `contractId`, `poiId`.
- Room tags or room names only as secondary display text.
- A local registry per domain.

Avoid:

- Importing another agent's module just to check whether it exists.
- Calling a content module from a generic system.
- Looking up content by Russian display name in hot logic.
- Mutating another module's private arrays.

The current `systems/events.ts` is the browser version of an EventBus. It already uses fixed-size buffers and avoids unbounded logs. Use it before inventing another bus.

## 11. Floor Architecture

Each floor should have the same outer structure:

```txt
src/gen/<floor>/
  index.ts              floor orchestrator
  content_manifest.ts   optional imports/registration only
  content_helpers.ts    local stamping helpers if repetition appears
  <module>.ts           one POI, NPC group, encounter, or room family
```

Floor orchestrator responsibilities:

- Create `World`.
- Generate base topology.
- Generate zones and levels.
- Place lifts.
- Run registered content modules.
- Spawn baseline population and loot.
- Bake lights.
- Return `{ world, entities, spawnX, spawnY }`.

Content module responsibilities:

- Never decide global floor topology.
- Never reset `entities`.
- Never change population caps outside its floor owner task.
- Never assume another module ran first unless the manifest explicitly orders them.

## 12. Definition Domains To Standardize Next

The following domains should move toward registry/data-first growth.

```txt
src/data/events.ts             EventDef[]
src/data/contracts.ts          ContractDef[]
src/data/resources.ts          ResourceDef[]
src/data/factories.ts          FactoryDef[]
src/data/economy.ts            Economy constants and price rules
src/data/rumors.ts             RumorDef[]
src/data/documents_*.ts        DocumentDef[] by faction/theme
src/data/monster_variants.ts   MonsterVariantDef[]
src/data/floor_catalog.ts      FloorDef[] for future floor expansion
```

Do not implement all of this in one pass. Each domain gets:

1. Definition file.
2. Minimal generic system.
3. Five to twenty defs.
4. Debug/check path.
5. README update only after it works.

## 13. Scalability Pillar

Every module must scale across four tiers.

Low:

- Static room geometry.
- Existing textures and sprites.
- Small spawn counts.
- Slow ticks.
- Text/audio/HUD feedback instead of simulation.

Middle:

- More variants and denser loot/NPC placement.
- Extra events and rumors.
- More procedural marks and lights during generation.

High:

- Extra visual marks, richer HUD hints, more simultaneous encounters.
- More detailed A-Life facts and economy state.

Ultra:

- Visual overkill through procedural texture variants, dense decals, rare set pieces, and bigger event pools.
- Still no unbounded per-frame world scans.

Rule: saved CPU buys atmosphere. It does not buy a physics toy.

## 14. Cinematic Cheat Policy

Prefer controlled fakes:

- Fog color, density, HUD warnings, and spawn weights instead of volumetric fog simulation.
- Static water/steam/pressure room states instead of fluid simulation.
- Room names, notes, event logs, and NPC barks instead of huge bespoke cutscenes.
- Procedural texture variants instead of imported assets.
- Spawn tables and behavior flags instead of one-off AI branches.
- Slow economy ticks instead of live market micro-simulation.

If a fake creates the same player decision, use the fake.

## 15. Black Box And Telemetry

Critical systems should expose recent state through bounded buffers.

Current precedent:

- `systems/events.ts` uses fixed-size recent, important, and per-zone event buffers.
- `msgLog` is capped.

For future critical systems:

```txt
System telemetry entry:
  tick
  floor
  zoneId
  hash or state id
  counts
  last action flags
```

Store the last 300 relevant samples, not infinite history. In browser runtime, dumps should go to debug UI, console, downloadable blob, or save data. In Node-side tooling, dumps may write under `Docs/AgentLogs/`.

Historical `Docs/AgentLogs`, task statuses and prompts were consolidated into `appendix.md` and archived under `gatbage/`. Recreate those directories only for an explicit orchestration/debug-dump task; routine patches should keep their durable notes compact and update `appendix.md` only when the context will be useful later.

## 16. Verification Checklist

Every agent patch must answer:

- What files changed?
- What new gameplay is visible?
- Which floor/zone/room can verify it?
- How does it react to samosbor or why is it exempt?
- How does it touch A-Life, factions, economy, quests, or events?
- What caps prevent frame-time growth?
- Did `npm run build` pass?
- Was README updated only if implementation facts changed?

Minimum local verification:

```txt
npm run build
```

For content:

- Confirm module is imported/registered.
- Confirm NPC or room can spawn.
- Confirm quest/data id is reachable.
- Confirm no use of nonexistent enum values.
- Confirm no full-world hot scan in render or per-frame update.

## 17. Anti-Patterns

Reject these on sight:

- `src/content.ts` with everything in one file.
- A floor module that edits `main.ts` for one NPC.
- A quest that requires changing AI internals.
- A renderer feature that owns gameplay state.
- A generator that overwrites `aptMask`.
- A module that assumes non-toroidal coordinates.
- A new enum for every tiny content variant.
- A system that scans all 1,048,576 cells every frame.
- A module that only adds text nobody can ever encounter.
- A rewrite of working systems to make a small feature feel "clean".

## 18. Recommended Growth Phases

Phase 0: Documentation and boundaries.

- Keep this file current.
- Add per-floor manifests only when conflicts appear.
- Keep README factual.

Phase 1: Registry hardening.

- Standardize registries for events, contracts, documents, monster variants, economy.
- Add duplicate-id checks.
- Add debug inspection for each registry.

Phase 2: Content lanes.

- Agents add one POI, one NPC/quest, one event pack, one monster variant pack, or one document pack per task.
- Integrator owns central enum/sprite/texture expansion.

Phase 3: Runtime systems.

- Add only generic slow-tick systems.
- Publish events for every important consequence.
- Preserve save compatibility.

Phase 4: Visual overkill.

- Spend saved cycles on procedural texture variants, marks, HUD feedback, room identity, and high-tier density.
- Do not add new simulation complexity unless it changes player decisions.

## 19. One-Agent Task Size

Acceptable task sizes:

- One content zone.
- One NPC with quest and room.
- One data file plus one generic system plus 5-20 defs.
- One monster with behavior and sprite registration.
- One small floor prototype.
- One debug screen.

Too large for one pass:

- "Implement whole economy."
- "Rewrite AI."
- "Add all future floors."
- "Make every NPC remember everything."
- "Move project to a new architecture."

## 20. Final Rule

The architecture is successful when adding content means creating a small file, registering a definition, running build, and seeing it in game. If a feature requires touching five shared systems, it is probably the wrong shape or it needs an integrator-owned API first.
