# Agent Instructions

## Operating Contract

This repository rewards precise integration work, not speculative architecture. Use extra reasoning budget to read the actual code, map ownership, and check side effects before editing. Keep patches small, shipped, and verifiable.

ГИГАХРУЩ is in active development. No legacy, no backward save compatibility, no hardcoding, no crutches. Do not preserve legacy paths by default, and do not add migration scaffolding unless the task explicitly requires it. Prefer one working, reachable gameplay path over broad unfinished systems.

## Project Identity

ГИГАХРУЩ is a zero-runtime-dependency TypeScript/Vite browser game: procedural survival-horror life-sim / ARPG shooter inside a 1024x1024 toroidal concrete megastructure.

The build target is one browser game: procedural textures, procedural sprites, procedural sound, WebGL raycasting, canvas HUD, flat entity arrays, typed-array world storage, browser APIs, and optional Cloudflare Net Sphere integration.

Core taste:

- No hardcoding, no crutches.
- Minimum code, maximum playable function.
- Elegant, universal, modular, minimal, expandable and natural.
- Data-oriented, procedural, context-driven, physmath-friendly systems.
- Plain functions, plain objects, typed arrays, ids and small registries.
- Cinematic fakes are better than expensive simulation when they produce the same player decision.

Do not add frontend frameworks, imported UI kits, physics engines, ECS libraries, asset pipelines, runtime dependencies, or linters outside `package.json` unless there is a measured reason and explicit owner.

## Mandatory Intake

Before changing gameplay, content, generation, systems, rendering, save/load, or docs:

1. Read `README.md`. It is the factual implementation map.
2. Read `architecture.md` before touching shared systems, integration points, floor architecture, save/load, A-Life, generation, or render hooks.
3. Read the relevant source files under `src/`; never implement from docs alone.
4. Check `git status --short` and do not overwrite unrelated dirty work.

Read additional docs only when relevant:

- `desdoc.md`: current design direction and next-iteration priorities.
- `plans.md`: unresolved or partial plan index.
- `alife.md` and `scaling.md`: persistent population, high-density entity and smoke baseline contracts.
- `Docs/ProceduralFloors/`: procedural geometry/anomaly authoring.
- `Docs/DesignFloors/` and `Docs/Expansions/`: active design/reference packets.
- `scenarist.md` and `Docs/ScenarioWriters/README.md`: player-facing text style/domain packets.
- `Docs/Localization/`: localization pipeline notes.
- `cloudflare.md`: optional Net Sphere deployment.
- `commit.md`: release commit/deploy runbook, only for explicit commit/release tasks.

`gatbage/**` and archived root prompt/status files are historical context only. Do not recreate old agent-log or task-status directories for routine work.

## Stack And Commands

Use existing npm scripts only.

```bash
npm run typecheck
npm run test:unit
npm run test:generation
npm run content:audit
npm run check:readonly
npm run build
npm run smoke
npm run check
npm run check:browser
npm run check:full
npm run check:release
```

Command intent:

- `npm run typecheck`: strict TypeScript preflight; no repo artifacts.
- `npm run test:unit`: Node unit tests through `tsx --test`.
- `npm run test:generation`: expanded generation matrix.
- `npm run content:audit`: static source/content audit.
- `npm run check:readonly`: typecheck, unit tests, content audit; safest broad agent gate.
- `npm run build`: production single-file browser build; writes `dist/`.
- `npm run smoke`: headless browser playability smoke; requires existing `dist/` and Chrome or `CHROME_BIN`.
- `npm run check`: default CI gate; writes `dist/`.
- `npm run check:browser` / `npm run check:full`: use for render, UI, mobile, canvas, input, or smoke-risk changes when Chrome is available.
- `npm run check:release`: release artifact gate; writes `dist/` and `itch/`.

Localization scripts exist and may write reports or locale files:

```bash
npm run l10n:extract
npm run l10n:audit
npm run l10n:report
npm run l10n:seed
npm run l10n:apply
```

Cloudflare scripts are optional and only matter for Net Sphere work:

```bash
npm run cf:setup
npm run cf:schema
npm run cf:dev
npm run cf:deploy
```

Do not edit generated artifacts such as `dist/`, `itch/`, localization reports, or `wrangler.jsonc` unless the task or command requires it.

## Validation Rules

Minimum verification:

- Docs-only: no runtime check required; run `git diff --check` when practical.
- Narrow data/content: run `npm run typecheck`; prefer `npm run check:readonly`.
- Systems, generation, save/load, AI, inventory, economy, quests, interactions, A-Life, rendering, UI, mobile or browser behavior: run `npm run check` unless blocked.
- Browser/render/mobile changes: also run `npm run check:browser` or `npm run check:full` when Chrome is available, and visually inspect if a dev server/screenshot path is used.
- Release/deploy changes: use the release or Cloudflare script named by the task.

If a check fails, inspect the real error and fix it. If a check is skipped, report the exact reason.

## Repository Shape

Current active source layers:

```txt
src/
  core/       primitive types, enums, constants, World, shared state shapes
  data/       definition registries: items, weapons, plot, economy, permits, terminals, variants
  entities/   monster definitions and procedural sprite packages
  gen/        floor generators, design floors, procedural floors, additive content modules
  systems/    runtime logic: AI, quests, A-Life, samosbor, factions, economy, save, interactions
  render/     WebGL raycaster, procedural sprites/textures, HUD, map, canvas overlays
  input.ts
  main.ts     browser entry point, game loop, floor switching, save/load wiring
```

Keep the five-layer contract intact:

- `core/` owns primitive shapes only. Changes here are integration work.
- `data/` owns definitions only. No world mutation, frame logic or DOM work.
- `gen/` owns construction: rooms, corridors, POIs, initial placement, floor content.
- `systems/` owns generic runtime behavior. Systems consume definitions and publish facts.
- `render/` reads state and draws. It must not decide gameplay.

`entities/` owns entity definition packages and sprite generation hooks; it is not a class hierarchy. `main.ts` owns loop order and high-level wiring; do not add content-specific calls there.

## Source Of Truth Rules

- `README.md` documents shipped behavior only. Update it when implementation facts change, not for intent.
- `architecture.md` documents engineering contracts and ownership rules.
- `desdoc.md` and `plans.md` may describe future intent; verify against current code before implementation.
- Active scenario/localization docs guide text passes; they are not substitutes for source inspection.
- Do not copy implementation counts from memory. If a count matters, verify it from source, scripts, or the current README.

## File Ownership

Green, usually safe for additive work:

- New `src/gen/<floor>/<module>.ts`
- New `src/gen/design_floors/<id>.ts` with manifest registration
- New `src/gen/procedural_anomalies/<module>.ts` with data/system hook
- New `src/data/<domain>_<module>.ts` or a small domain definition file
- New `src/entities/<monster>.ts`
- New focused tests under `tests/`
- New docs under active `Docs/` folders

Yellow, edit narrowly:

- Floor `content_manifest.ts` files
- `src/gen/living/side_quests.ts`
- `src/gen/floor_manifest.ts`
- `src/gen/design_floors/manifest.ts`
- `src/data/items.ts`, `src/data/weapons.ts`, `src/data/psi.ts`, `src/data/plot.ts`
- `src/entities/monster.ts`
- `src/render/sprite_index.ts`, `src/render/sprites.ts`, `src/render/textures.ts`
- `src/systems/debug.ts`, `src/systems/debug_cheats.ts`

Red, integrator-owned:

- `src/core/types.ts`
- `src/core/world.ts`
- `src/main.ts`
- `src/gen/shared.ts`
- broad AI/pathfinding/combat rewrites
- shared quest, inventory, samosbor, save/load or renderer rewrites
- `src/render/webgl.ts` unless adding a generic render channel

If a task needs a red file, make the smallest generic hook/API change, then keep content in modules.

## Floors And Routes

There are six `FloorLevel` story/base values: Ministry, Kvartiry, Living, Maintenance, Hell and Void. Do not add a new enum value for a route stop, catalog entry, anomaly or numbered lift.

Normal lift travel uses the per-run vertical route in `src/systems/procedural_floors.ts` and route definitions in `src/data/design_floors.ts` / `src/data/procedural_floors.ts`. Authored design floors are string-id route stops generated through `src/gen/design_floors/manifest.ts` and expanded through `src/gen/design_floors/full_floor.ts`.

When adding route content:

- Add route data in `src/data/design_floors.ts` only for a real implemented generator.
- Add generator code under `src/gen/design_floors/`.
- Register it in `src/gen/design_floors/manifest.ts`.
- Keep route-specific gameplay out of `main.ts`.
- Respect NPC-free endgame route floors where `floorRunZAllowsNpcs()` disallows NPCs.

`src/data/floor_catalog.ts` is data-only future catalog material until a real generator and transition hook exist.

## Content Module Contract

Prefer one self-contained module with:

1. Stable lowercase snake_case ids.
2. Local constants.
3. Optional data registration: NPC, quest, contract, event, document, economy, room or monster definition.
4. One generator/spawn function.
5. Optional debug/test hook.
6. A reachable player-facing path.

Every meaningful module should offer a decision such as trade, steal, repair, escort, kill, hide, forge, expose, reroute, flee or a clear debug-only path.

Use existing extension points:

- Side quests: `registerSideQuest()` / `registerSideQuestSteps()` in `src/data/plot.ts`.
- Living POIs: `registerZoneContent()` in `src/gen/living/zone_content.ts`.
- Floor content: `content_manifest.ts` for Ministry, Kvartiry, Maintenance, Hell, Void and Living side-effect imports.
- Design floors: `src/data/design_floors.ts` plus `src/gen/design_floors/manifest.ts`.
- Procedural floors/anomalies: `src/data/procedural_floors.ts`, `src/gen/procedural_floor.ts`, `src/gen/procedural_anomalies/`, `src/systems/procedural_anomalies.ts`.
- Samosbor: `src/data/samosbor_variants.ts`, `src/data/samosbor_director.ts`, `src/systems/samosbor_hooks.ts`.
- Events: `publishEvent()` in `src/systems/events.ts`.
- Interactions: shared `E` dispatcher in `src/systems/interactions.ts`.
- POI audit/debug metadata: `withPoiGenerationMetadata()` / `recordPoiGenerationMetadata()` where manifests already use it.

Do not import another agent's unfinished content module just to detect it. Communicate through ids, registries and events.

## Generation Rules

The world is a 1024x1024 torus. Use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2`; prefer `dist2` for comparisons.

Generated POIs must:

- Bulldoze only appropriate cells; do not erase protected `aptMask` content.
- Set `cells`, `roomMap`, `wallTex`, `floorTex`, `features` and relevant marks consistently.
- Create real `Room` records with useful `RoomType` and names.
- Add doors to `world.doors` and `room.doors`.
- Connect to reachable floor/corridor space.
- Preserve lifts, hermetic walls, protected rooms and required anchors.
- Spawn via `nextId.v++` or sync with `syncNextEntityId()` after mixed helpers.
- Respect entity soft limits through `src/systems/entity_limits.ts`.
- Publish/register enough data for quests, map, debug or events to find it.

For floor-wide population or loot scattering, use `src/gen/population_placement.ts` and placement profiles. Do not pile large populations into one room or add runtime bucket systems for generation-time placement.

Runtime geometry mutations must bump the relevant dirty versions on `World` (`cellVersion`, `surfaceVersion`, texture versions, fog version) through existing helpers or local precedent so AI/render caches stay valid.

## Runtime Systems

New systems must be generic and bounded.

A runtime system needs:

- A data file or registry.
- A bounded cadence, radius, cap, dirty flag or fixed-size buffer.
- A debug/inspection path when practical.
- `publishEvent()` for important public facts.
- Save serializer/sanitizer if it stores persistent state.
- Current-shape sanitization for corrupt saves.

Avoid:

- Per-frame full-world scans.
- Per-module `setInterval`.
- Per-entity closures allocated during updates.
- JSON parse/stringify in hot paths.
- DOM work in systems.
- Renderer-side gameplay state.
- Periodic refill-to-cap population spawners.

Use `systems/entity_index.ts` for broadphase-style nearby entity queries and follow existing AI/pathfinding field patterns instead of starting per-actor BFS work.

## A-Life And Population

`systems/alife.ts` owns persistent ordinary NPC identity. A run reconstructs a compact pool from seed/count and materializes only the active floor. Live state is folded back on transitions, samosbor rebuilds and save. Deaths are persistent facts.

Rules:

- No ordinary background NPC refill.
- No silent replacement of killed persistent people.
- No generator-side identity creation after A-Life materialization.
- Ambient generator NPCs are placement templates unless a module is explicitly spawning authored/event actors.
- Plot NPC identity uses stable `plotNpcId`; future ordinary quest sources should move toward persistent ids.
- Personal relation to the player is separate from faction relation and must fold back through A-Life state when persistent.
- The player participates in shared social math: karma, kill counters and rank.
- Off-floor NPCs are frozen except bounded aggregate events, migrations or compact overrides.

Allowed new actors must declare their reason: quest, faction event, caravan, samosbor, lift encounter, hack backlash, authored scene or debug.

## Save And Load

The browser save lives in `localStorage` under `gigahrush_save`. The authoritative save shape constant is `SAVE_SHAPE_VERSION` in `src/systems/save_runtime.ts`.

Only the current save shape is supported. If a change breaks shape compatibility, bump `SAVE_SHAPE_VERSION` and reject stale saves explicitly. Do not add cross-version migration code by default.

If adding persistent state:

- Add it to save payload/runtime through existing section patterns.
- Sanitize malformed current-version input.
- Cap arrays and numeric ranges.
- Save ids, seeds, compact facts and sparse overrides rather than full object graphs.
- Add or update tests when the shape or rejection behavior changes.

## Events And Cross-System Communication

Use `systems/events.ts` before inventing a new bus. Event data is compacted and bounded; keep payloads small, id-based and public/private-scoped.

Preferred communication:

- `publishEvent(state, draft)`
- definition ids such as `factoryId`, `documentId`, `contractId`, `poiId`, `routeId`
- room ids, zone ids, faction ids and tags
- local registries

Avoid:

- Russian display-name lookups in hot logic.
- Mutating another module's private arrays.
- Importing content modules from generic systems.
- Unbounded logs or telemetry.

## Rendering, UI And Input

This is WebGL/canvas UI, not a DOM component app.

Rules:

- `render/` reads state and draws. Gameplay decisions stay in `systems/`.
- Use existing procedural textures, sprites, marks, particles, HUD panels, map overlays and log patterns.
- Add generic render hooks when needed; do not put one floor's gameplay in `render/webgl.ts`.
- Keep HUD/canvas text readable and unclipped on desktop and mobile.
- Use existing UI helpers such as `ui_layout`, `ui_text`, panel modules and control bindings.
- Touch/mobile changes must respect joystick, menu rail, fullscreen/direct-page behavior and canvas resizing.
- Do not add CSS frameworks, DOM-heavy interfaces or imported asset packs.

After render/UI/mobile/input changes, run browser validation when possible and visually check for blank canvas, scaling, clipping, unreadable text and broken interaction focus.

## Items, Weapons, PSI And Monsters

Items:

- Extend `src/data/items.ts` with an `ItemDef`.
- Give it type, value, spawn rooms/tags and use effect when applicable.
- Map economy/resource behavior in the relevant data/system files when needed.

Weapons:

- Add the item entry.
- Add physical stats in `src/data/weapons.ts` or PSI stats in `src/data/psi.ts`.
- Ensure ammo/tool/resource hooks and sprites exist.

Monsters:

- Add a focused package in `src/entities/`.
- Register in `src/entities/monster.ts`.
- Add ecology/counterplay in `src/data/monster_ecology.ts`.
- Add AI hooks only where generic behavior cannot express the creature.
- Add rumors or cues when the player needs learnable counterplay.

Do not expand core enums for every named encounter if existing entities, room state, marks, events and local mechanics can express it.

## Text And Localization

Russian player-facing text is canonical unless a task explicitly asks for translation. Do not translate existing Russian by accident.

For text-heavy tasks:

- Read `scenarist.md` and the relevant `Docs/ScenarioWriters/` packet.
- Keep tone consistent with existing in-game strings.
- Run localization audit/report scripts when changing broad player-facing text or locale data.
- Use the l10n scripts for generated inventories, reports and locale seeding/applying; do not hand-maintain generated reports casually.

## Cloudflare Net Sphere

Net Sphere is optional. The local single-file game must continue to work when Cloudflare API, D1 binding, market endpoint or chat are offline.

For Net Sphere work:

- Read `cloudflare.md`.
- Keep network payloads sanitized and bounded.
- Preserve local identity/session fallback behavior.
- Use Cloudflare scripts only when the task needs them.

## Documentation Discipline

Update docs only when facts change.

- `README.md`: shipped behavior, commands, active implementation map.
- `architecture.md`: engineering contracts and ownership rules.
- `desdoc.md` / `plans.md`: planning and future work.
- `appendix.md`: compact historical notes only when useful later.

Do not use README to promise unfinished work. Do not bury implementation facts only in plan docs.

## Working Habits

- Prefer `rg` / `rg --files` for search.
- Read local patterns before inventing helper APIs.
- Keep edits close to the requested behavior.
- Add abstraction only when it removes real duplication or matches an established local pattern.
- Do not split files for arbitrary line counts.
- Use comments only for non-obvious mechanics, math or performance constraints.
- Preserve Russian strings and existing encoding.
- Do not revert unrelated dirty files.
- Do not churn `.DS_Store`, generated builds, lockfiles or docs unless the task requires it.

## Patch Checklist

Before finishing, answer these for any source change:

- What changed and why?
- Where is the new gameplay visible or which debug path reaches it?
- Which floor, route, zone, room or system verifies it?
- How does it react to samosbor, or why is it exempt?
- Does it touch A-Life, factions, economy, quests, events, save/load, localization or render?
- What cap, cadence, cache, dirty flag or placement-time work prevents frame-time growth?
- Were docs updated only for shipped facts?
- Which checks passed, or why were checks skipped?

## Anti-Patterns

Reject these:

- Content-specific logic in `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.
- A new `FloorLevel` for a design-floor route stop, catalog entry or lift anomaly.
- Runtime population refill that replaces killed ordinary NPCs.
- Per-frame full-world scans.
- A renderer feature that owns gameplay state.
- A quest that requires hardcoding one NPC in generic AI.
- A generator that overwrites protected apartments or seals unreachable rooms.
- Dead data with no reachable gameplay or debug path.
- Large refactors before playable content delivery.
