# GIGAH|RUSH / ГИГАХРУЩ

> Центральный документ проекта.
>
> Роль: единая факт-карта игры, сборки, текущих shipped systems и рабочих команд. Все остальные root-документы являются ключевыми системными томами вокруг этого README: они уточняют AI, A-Life, этажи, самосбор, сохранения, бой, экономику, баланс, предметы, крафт, монстров, квесты, оптимизацию, стиль, тексты, online/mobile контуры. README не должен обещать незавершенное; он фиксирует только то, что реально есть или является проверенным контрактом проекта.

**GIGAH|RUSH / ГИГАХРУЩ** - zero-runtime-dependency TypeScript/Vite browser game: procedural survival-horror life-sim / ARPG shooter inside a toroidal 1024x1024 concrete megastructure.

Procedural textures, procedural sprites, procedural sound, WebGL raycasting, canvas HUD, flat entity arrays, typed-array world storage. No runtime frameworks, no asset pipeline, one browser build.

Core engineering taste: no hardcoding, no crutches. Keep systems elegant, universal, minimal, modular, data-oriented and emergent. Наш долгосрочный фокус — довести симуляцию до состояния «генератора историй» (как Dwarf Fortress или Space Station 13), где A-Life, процедурная генерация и Самосбор постоянно создают непредсказуемые ситуации, о которых игроки будут рассказывать байки.

Storage order is never world physics. Array/index order inside `world.rooms`, `entities`, zones, anchors, factories, resources or any other runtime collection is an implementation detail, not a gameplay rule. Bounded optimization must preserve isotropy through actor-local cursors, deterministic rotated windows, spatial queries, scoring before truncation or explicit authored priority. A stable first-prefix scan such as "first 96 rooms" is hardcoding by storage accident and is forbidden for gameplay-visible decisions.

This README is the factual implementation map. Design priorities for the next iteration are in [desdoc.md](desdoc.md). Engineering ownership and module rules are in [architecture.md](architecture.md).

## Project Bible

ГИГАХРУЩ is built around one loaded 1024x1024 toroidal floor as a living simulation surface. Materialized NPCs, monsters, projectiles, rooms, factions, containers, events and samosbor effects share that same `World` and `entities` array. The current AI foundation is the full-pass isotropic model: no player-spawn bubble, no hot/cold AI tiers, and no distance-based simulation truth. Every live AI actor on the current floor receives the same simulation pass regardless of distance from the player, while expensive choices use broadphase/path caches and actor-local cooldowns.

Routine NPC movement deliberately allows corridor traffic but treats gradual corridor attractors as a P0 AI regression: low-pressure routine intents must not keep replacing active paths into A-B-A corridor loops, and the Living-floor regression stays in the normal unit/check gate.

Порядок хранения не должен становиться физикой мира. If a system caps work for performance, that cap must not make the first generated rooms, first live entities, first lift anchors or first definitions more real than the rest of the floor. The game may be cheap and bounded; it may not be secretly biased by array prefix.

The player is an entity reference, not a separate world type or control flag. Runtime `player` points at the live actor currently being played; PSI possession temporarily swaps that reference to a lower-INT NPC or monster, then restores the previous player entity when the effect ends. The death screen can also continue the run by moving that reference to a random living NPC on the current floor while leaving `R` as restart. Human/NPC bodies share a `2.0` base move speed, and Agility supplies the intended movement spread at +1% speed per point plus slower asymptotic attack-cooldown improvement. The native persistent body is still marked with `persistentNpcId: 'player'` for save/floor-boundary reconstruction, but input, camera, HUD, inventory, needs, name, damage feedback and tools read the current `player` entity directly. Combat, faction hostility, damage, events, A-Life social math, toroidal coordinates and samosbor selection operate on entities. Possession deliberately lets delayed shots, blame, faction responses and other consequences follow ordinary entity ownership unless a future PSI effect explicitly defines a psychic signature. Runtime camera behavior lives in `src/systems/camera.ts`: it resolves player-follow, movement-derived head bob, death-camera and future free/cinematic modes into a transient `CameraView` consumed by render. Systems should preserve this isotropy: when a mechanic can apply to any actor, it should not become player-only logic.

The vertical game is the persistent `FloorRun`: the player starts on `LIVING` at `z=0`, normal lifts span `z=-50..+50`, and every stop is a keyed floor identity. Story anchors, authored design floors, procedural stops and numbered lift instances are separate little worlds with their own generator/package, population field, NPC/monster mix, rules, POIs and route role. Danger and pressure generally rise away from the center through `z`, `abs(z)`, floor data, anomaly pressure and local design overrides rather than one hardcoded formula.

The building is inhabited before the player arrives. A-Life creates a seed-sized population around `100_000` procedural NPC identities per run, with `131_072` as the technical identity capacity, and distributes them across story, design and procedural route keys from a run-start population plan before the first floor is generated. Plot/authored/event reserved identities occupy slots inside that same budget; `npc:*` package reservations marked `presence: 'population'` can fill ordinary materialization slots, while `event_only` and legacy plot reservations stay event/authored-owned. Only the current floor is materialized into live AI; off-floor people are persistent records. Current shipped macro changes come from folded live state, deaths, saved overrides, bounded cold A-Life migration, caravan/economy/faction/contract events and authored arrivals. Deaths are permanent, ordinary background refill is disabled, and cleared floors stay changed until an explicit arrival or migration changes them.

Samosbor is not a loading-screen reset. It is a random local world mutation on the current map: warning, active pressure, shelter checks, variant effects, local geometry rewrite, aftermath, events and the stitched floor state becoming the next persistent snapshot for that floor key.

Bulky passable-cell objects have a cheap fine movement layer. `World.pathBlockers` stores eight row bytes per cell; explicit blocker definitions for tables, beds, shelves, machines, apparatus, sinks, toilets and bulky containers are stamped from generated `Feature`/container facts after story, design and procedural floor construction. Player movement and ordinary AI path-follow movement use one coarse+fine occupancy helper, while coarse pathfinding stays cell-level. If an actor is restored, spawned or caught inside a blocker after generation/runtime rebuild, the shared movement layer relocates it to the nearest valid coarse+fine occupancy point instead of adding object-specific fixes. The blocker array is active-world state only: save payloads and packed floor memory do not serialize the full 8 MiB field, and render-only `visualSlots` / mesh model bounds are not collision sources.

The render-only mesh pass can also give rectangular 2D corridors a bounded 3D envelope. Floor/procedural theme tags select a corridor covering module: concrete relief, technical pipes/cables, collector gutters, cave protrusions/stalactites, smooth meat folds or sparse void silhouettes. Placement is deterministic from seed, room and cell hash gates, not a repeating stride, and it does not change cells, collision, save data or floor memory.

## Save And Legacy Policy

The browser save lives in `localStorage` under `gigahrush_save` and carries the shape version from `src/systems/save_runtime.ts`. ГИГАХРУЩ is in active development: old saves and legacy runtime paths are not a product contract. When a gameplay/system update breaks save shape, bump the save shape version and reject stale saves explicitly instead of adding cross-version migration code.

Runtime sanitizers are still expected for the current save shape so corrupted local storage cannot crash loading. They are not a promise to load older development builds.

## Documentation Map

Active docs are the project monument. Use them by role:

- `README.md`: shipped implementation facts only.
- `AGENTS.md`: mandatory repository instructions for agents.
- `architecture.md`: all major engine/system contracts and integration rules.
- `desdoc.md`: core design direction, atmosphere and next-iteration priorities.
- `ai.md`: active-floor low-level NPC/monster AI, movement, state machines and reactions.
- `fight.md`: dynamic full-floor combat, projectiles, target pressure and tactical simplicity.
- `alife.md`: persistent procedural NPC identity, deaths and macro world consequences.
- `npc.md`: NPC package/questionnaire system, author-facing kinds and transition plan.
- `korovan.md`: cold A-Life migrations, caravan identity logistics and `Инфосеть Демос` NPC profile surface.
- `demos.md`: `Инфосеть Демос` social A-Life surface: NPC profiles, links, feed, reactions, quest notices, save/runtime caps and extension boundaries.
- `samosbor.md`: samosbor warning, shelter, local rebuild, variants and aftermath contract.
- `save.md`: current save shape, payload sections, sanitization and persistence contract.
- `floors.md`: vertical world, route stops, floor memory, geometry and floor ownership.
- `anomalies.md`: procedural-floor, cellular-world and anomaly runtime system contract.
- `economics.md`: macroeconomy, production, resources, prices, caravans and markets.
- `balance.md`: numeric progression, money bands, HP/XP, rewards and level pressure.
- `items.md`: item, weapon, resource, loot and production system contract.
- `psi.md`: PSI clots, non-damage magic, phase/mark/recall/control/possession and current-player identity rules.
- `kraft.md`: player-facing crafting system contract: materials, item composition, recipes, stations, recipe knowledge, UI/save/runtime rules.
- `monsters.md`: monster package, ecology, sprite and AI tactic system contract.
- `ecology.md`: monster ecology ownership: data, generation, AI/A-Life boundary, stimuli, counterplay, samosbor reactions, caps and tests.
- `quests.md`: story, side quests, contracts, characters and quest consequences.
- `optimization.md`: performance principles, runtime budgets and safe optimization lanes.
- `tests.md`: validation strategy and cheap deterministic test rules.
- `problems.md`: problematic non-system mechanics and consolidation targets.
- `interactive.md`: interactive world objects and shared `E` action layer.
- `graphics.md`: current WebGL/canvas renderer, screen effects, surface marks, sprites and visual settings.
- `animation.md`: current render-only entity animation system, frame-pack intake, clip resolver, texture caches and Olga walk/harm clips.
- `mesh.md`: current render-only mesh pass system: visual slots, generator-selected corridor coverings, geometry profiles, procedural models, voxel detail, stats, caps and tests.
- `block.md`: shipped first-pass 8x8 path blockers for bulky 2D objects plus remaining future boundaries.
- `mobile.md`: mobile input, UI, viewport and mobile validation.
- `online.md`: future optional online mode; core single-player remains primary.
- `scenarist.md`: player-facing text style, lore voice and scenario copy.
- `taste.md`: visual/audio/UI/atmosphere taste bible.
- `cloudflare.md`: optional Cloudflare Net Sphere deployment notes.
- `commit.md`: release commit/deploy runbook.
- `LICENSE.md`: Народная Лицензия for free digital access, attribution, share-alike derivatives, voluntary donations, commercial distribution with a free copy, and fan-merch permission.
- `PRCampaign/`: active PR, media, portal, KPI and public-campaign continuity docs.

The appendix archive lives outside this repository at `../gatbage/`. It preserves historical prompts, reference packets, media picks, local reports and scratch artifacts without making them part of ordinary repository context.

Default engineering intake is `README.md`, the relevant root system docs above, current `src/` and focused tests. Do not search or read `../gatbage/**`, `dist/**`, `itch/**`, `pikabu/**`, `portal/**`, `tmp/**`, `screenshots/**`, `locales/en.json` or `src/data/bad_apple_frame_pack.ts` during ordinary code work unless the task explicitly asks for archive/media/release context, generated artifacts, screenshots, localization bundle output or dormant experiment data. Normal searches from the repository should stay focused on code and primary docs to avoid filling agent context with heavy artifacts.

Task-specific optional appendix references:

- `../gatbage/reference/design_floors/`, `../gatbage/reference/procedural_floors/` and `../gatbage/reference/expansions/`: design/reference packets for floor, route and anomaly authoring tasks only.
- `../gatbage/reference/ux_rework/`: cautious UX rework briefs based on player feedback; not shipped-behavior facts until implemented and verified.
- `../gatbage/reference/localization/`: localization pipeline notes and generated missing-translation reports.
- `../gatbage/reference/scenario_writers/`: subordinate voice/domain packets for text passes only. Read `../gatbage/reference/scenario_writers/README.md` before using them.

Archived root planning and item-orchestration documents, including old `expansion.md`, `plans.md`, `scaling.md`, `items_orchestrator.md` and `items_000_manifest.md`, live under `../gatbage/history/` and are not active source of truth.

Root `genfix_*.md` and `architecture_fix_*.md` batch/orchestration notes now live under `../gatbage/history/batches/genfix/` and `../gatbage/history/batches/architecture_fix/`. Verify archived notes against active docs and current `src/` before using them.

Root `kraft_0.md`..`kraft_7.md` were orchestration prompts for the crafting implementation batch. They now live under `../gatbage/history/batches/kraft/`. Use active [kraft.md](kraft.md), README and current `src/` instead of those archived prompts for shipped crafting facts.

Root `ecology_0.md`..`ecology_11.md` were orchestration prompts for the monster ecology implementation batch. They now live under `../gatbage/history/batches/ecology/`. Use active [ecology.md](ecology.md), [monsters.md](monsters.md), README and current `src/` instead of those archived prompts for shipped ecology facts.

Root `MACRO2_*.md` files were orchestration prompts, not documentation source of truth. They now live under `../gatbage/history/batches/macro2/` with the old parallel contract. Verify any archived prompt against the active docs and current `src/` before implementation.

Root `korovan_0.md`..`korovan_6.md` were orchestration prompts for the cold A-Life/caravan migration implementation batch. They now live under `../gatbage/history/batches/korovan/`. Use active [korovan.md](korovan.md), [alife.md](alife.md), [economics.md](economics.md), README and current `src/` instead of those archived prompts for shipped macro A-Life/caravan facts.

Root `demos_0.md`..`demos_6.md` were orchestration prompts for the `Инфосеть Демос` implementation batch. They now live under `../gatbage/history/agent_tasks/demos/`. Use active [demos.md](demos.md), README, [alife.md](alife.md), [korovan.md](korovan.md), [quests.md](quests.md) and current `src/` instead of those archived prompts for shipped Demos facts.

Root `npc_index.md` and `npc_0.md`..`npc_13.md` were orchestration prompts for the NPC package/intake implementation batch. They now live under `../gatbage/history/batches/npc/`. Use active [npc.md](npc.md), the active NPC package schema, `gigahrush-npc-intake/`, README and current `src/` instead of those archived prompts for shipped NPC package facts.

Root `mesh_0.md`..`mesh_12.md` were orchestration prompts for the render-only mesh pass implementation batch. They now live under `../gatbage/history/batches/mesh/`. Use active [mesh.md](mesh.md), [graphics.md](graphics.md), README and current `src/` instead of those archived prompts for shipped mesh facts.

Root `block_0.md`..`block_6.md` were orchestration prompts for the path blocker implementation batch. They now live under `../gatbage/history/batches/block/`. Use active [block.md](block.md), [architecture.md](architecture.md), [mesh.md](mesh.md), README and current `src/` instead of those archived prompts for shipped blocker facts.

Historical agent prompts, statuses, logs, batch files, retired root planning passes, root itch-page ZIP archives, scratch notes and the former appendix live under `../gatbage/` with paths preserved where practical. `../gatbage/**` is archive-only context unless a task explicitly asks for historical comparison. Do not recreate `../gatbage/history/agent_tasks`, `../gatbage/history/agent_logs`, `../gatbage/history/agent_prompts` or `../gatbage/reference/design_floors/AgentPrompts` for routine work.

## Build And Commands

```bash
npm install
npm run dev
npm run typecheck
npm run test:unit
npm run test:generation
npm run build
npm run build:size
npm run preview
npm run smoke
npm run content:audit
npm run l10n:extract
npm run l10n:audit
npm run l10n:report
npm run l10n:seed
npm run l10n:apply
npm run check:readonly
npm run check:browser
npm run cf:setup
npm run cf:schema
npm run cf:dev
npm run cf:deploy
npm run check
npm run check:full
```

Stack: TypeScript, Vite, `vite-plugin-singlefile`, WebGL/canvas, browser APIs. `npm run check` semantics are unchanged: typecheck, unit tests, content audit and production build.

| Command | Writes repo artifacts | Requires | Use |
| --- | --- | --- | --- |
| `npm run typecheck` | none | none | TypeScript preflight. |
| `npm run test:unit` | none | none | Node unit tests via `tsx --test`; no separate emitted Node build. |
| `npm run test:generation` | none | none | Expanded procedural/design generation matrix enabled by `GIGAHRUSH_GENERATION_MATRIX=1`. |
| `npm run content:audit` | none | none | Static source/content audit. |
| `npm run l10n:extract` | `../gatbage/reference/scenario_writers/game_text_inventory.md` | none | Writes the scenario-writer player-facing text inventory from source strings. |
| `npm run l10n:audit` | none | none | Localization coverage audit: extracts canonical Russian player-facing text and compares it with `locales/*.json`. |
| `npm run l10n:report` | `../gatbage/reference/localization/audit.json`, `../gatbage/reference/localization/missing-<locale>.md` | none | Writes localization coverage reports for missing/todo/orphan translations. |
| `npm run l10n:seed` | `locales/<locale>.json` | existing translations | Merges missing canonical strings into a locale as `todo` records; pass `-- --locale <code>` for non-English locales. |
| `npm run l10n:apply` | `locales/<locale>.json` | translation batch file | Applies a reviewed batch such as `locales/_en_core.json` and fails on placeholder/source errors. |
| `npm run check:readonly` | none | none | Safe preflight for agents: typecheck, unit tests and content audit. |
| `npm run build` | `dist/` | none | Production single-file browser build. |
| `npm run build:size` | `dist/build-size-report.json` | existing `dist/` | Warning-only size report for single-file HTML, gzip, dormant experiment data and source/render buckets. |
| `npm run check` | `dist/` | none | Default CI gate: readonly checks plus production build. |
| `npm run preview` | none | existing `dist/` | Serve the current production build locally. |
| `npm run smoke` | none in repo | Chrome or `CHROME_BIN`; existing `dist/` | Browser playability smoke through Vite preview and headless Chrome. `SMOKE_VISUAL_GEOMETRY_MODE=off|low|medium|high` forces the browser-local mesh setting for render validation. |
| `npm run check:browser` | `dist/` | Chrome or `CHROME_BIN` | Self-contained browser gate: build, then smoke. |
| `npm run check:full` | `dist/` | Chrome or `CHROME_BIN` | Full validation: `check`, then smoke. |
| `npm run cf:setup` | `wrangler.jsonc`; remote D1 | Cloudflare auth/Wrangler | Create/find D1, write binding, apply schema and migrations. |
| `npm run cf:schema` | remote D1 | Cloudflare auth/Wrangler | Reapply schema and guarded migrations to the configured D1 database. |
| `npm run cf:dev` | `dist/` | Cloudflare auth/config; Wrangler | Build in Cloudflare mode, including `/npc-intake/`, then run the Worker locally. |
| `npm run cf:deploy` | `dist/`; remote Worker | Cloudflare auth/config; Wrangler | Build in Cloudflare mode, including `/npc-intake/`, then deploy the Worker. |

`npm run build:size` reads the latest `dist/index.html` and reports raw HTML size, gzip size, dormant Bad Apple experiment source size, approximate sprite/texture source buckets and Rollup rendered module buckets from `dist/build-size-manifest.json`. Current warning thresholds are 9.5 MB HTML and 4.5 MB HTML gzip. Bad Apple keyframe/delta frame data and low-fi audio remain in source as an engine-capability experiment, but they are excluded from ordinary local, itch, Pikabu, static HTTPS and Cloudflare builds because their build weight is not worth the shipped gameplay value. Restoring the experiment should be an explicit build/content decision, not the default release path.

Cloudflare scripts are optional and only matter for Net Sphere deployment.

## Cloudflare Net Sphere

When deployed as a Cloudflare Worker with Assets and the D1 binding described in [cloudflare.md](cloudflare.md), the game exposes an optional in-game `НЕТ-СФЕРА` terminal on `N`. Inside that terminal, `Enter` selects the chat line when it is inactive, and submits the current line and leaves chat input when it is active, including an empty line that sends nothing. `Backspace` erases chat characters only while chat input is active, `Space` stays printable chat input only while chat input is active, `N` closes the terminal only when chat input is not active, `Delete` and right mouse close the terminal, and mouse wheel / `PageUp` / `PageDown` / arrow keys scroll the loaded chat history; `Esc` is deliberately left to the browser/pointer-lock path and is not a gameplay window key. In Cloudflare-mode builds the title launch menu also exposes a separate `ДОБАВИТЬ ПЕРСОНАЖА` route into the `gigahrush-npc-intake` questionnaire site; ordinary local, itch and default single-file builds hide that row and do not ship the intake subproject. The NPC intake route opens as a normal browser document at `/npc-intake/`, outside the canvas/pointer-lock loop; in configured online builds its `Send to dev inbox` action posts the validated ZIP to `/api/npc-intake/submit`, stores files and review metadata as BLOBs in the `NPC_DB` D1 database, while `Export ZIP` remains the manual fallback. The standard title flow asks for language, then `Enter` opens a launch menu for `НЕТ-ИМЯ`, player age, player sex, optional run seed and the active NPC/monster soft cap. Age defaults to `25`, sex defaults to male, and both are saved in browser-local setup state and copied into the player entity/save payload. Blank seed means a fresh random route seed, while a typed numeric/text seed fixes the per-run route deck and the seed-scoped story/design/procedural floor generation used for first construction and samosbor regrowth. The actor cap defaults to `4096` and can be set from `1024` to `16384` in `1024` steps before a run starts; story, procedural and authored-route floor population densities resolve their NPC/monster target counts from that cap, so the default cap preserves current shipped density. Each browser also gets a persistent private `НЕТ-ГЕН` id in `localStorage` and a session id in `sessionStorage`. `/netgen NET-...` switches back to an existing cloud profile, `/new` creates a new `НЕТ-ГЕН`, and `/clear` clears local chat history. The terminal polls while open, sends a 30-second heartbeat, records active sessions, route seed/current `z`/route id, samosbor events, deaths, compact progress, recent dry event summaries such as `Жилец умер. Последний сигнал: Жилая зона, д2 08:30.`, and short sanitized chat messages labeled by nickname. The Worker also exposes an optional `/api/net/market` endpoint for compact global market impulses and bounded aggregate quote snapshots. If the binding is missing or the API is offline, the game continues as a local single-file build.

Direct HTTPS builds also expose PWA metadata. Desktop play has a remappable `F11` fullscreen action that requests browser fullscreen with hidden navigation UI and never auto-opens on load. The mobile `FULL` control requests browser fullscreen only on compatible non-iOS browsers. Embedded mobile hosts show a direct-page launcher instead. iPhone/WebKit does not get the forced fullscreen path because it can reload the web view; iOS standalone Home Screen launch remains supported through the manifest and Apple web-app meta tags.

The runtime HUD is configurable through the `U` UI orchestrator menu. HUD elements are stored in browser-local UI settings outside the game save; fresh local settings use the `Новичок` preset with bottom tabs, weapon panel, crosshair, simple `E` interaction prompt, hazard warnings, minimap support and weak neuro-interface interference enabled, while route hints, the FPS counter and the transient stenographic HUD summary are off by default. The same interface settings include browser-local item autopickup: it is on by default for current walk-over pickup behavior, and when disabled aimed world item drops show a name/description pickup panel and are taken only through `E`. When enabled, the stenographic summary is a top HUD band capped to the upper third of the screen; it expands to the minimap edge when the minimap is visible, expands farther when it is hidden, wraps recent messages, and shows time and distance by game time so paused menus do not age it out. Samosbor prewarnings enter the stenographic summary and full log as a short expected-variant line instead of drawing a separate descriptive prewarning panel. The optional FPS counter is a small top-left debug readout with FPS, frame ms average/max, live/updated AI counts, visible sprite counts and recent AI/render/HUD timings. The same browser-local settings also store desktop mouse sensitivity, defaulting to 130% of the old mouse-look speed, mobile look sensitivity, defaulting to 50% of the original touch rotation speed, and render-only 3D detailing mode, defaulting to low; [mesh.md](mesh.md) owns the detailed mesh pass contract and caps. The full message log still records entries and opens with `L`. NPCs with authored quest action - either an authored quest they can issue now or an authored active TALK target - are marked by a bright yellow `!` in the existing aim target name/HP box, not in the `E` prompt; procedural quest offers use a blue `!`. Map entity dots use relation colors for ordinary NPCs: green friendly, yellow neutral and red hostile; procedural quest offers and procedural TALK targets keep blue quest NPC markers, while authored quest NPC markers use green for idle authored quest NPCs and gold for authored quest actions. Procedural givers that already issued or completed their quest fall back to ordinary relation-colored NPC dots. `M` opens the standalone full map overlay only from gameplay and closes the full map when it is already open and no text input/capture is active, while right mouse also closes it like other ordinary canvas menus. While the full map is open, mouse wheel changes its zoom radius. Other menu-opening shortcuts do not switch to another menu while a canvas menu is already open. Opening the map closes other canvas interfaces and does not pause the simulation. The `G` map legend/settings screen can switch map color mode, individual marker layers and an off-by-default high-contrast map palette; the `U` interface setting controls only the HUD minimap. The full map does not draw the quest strip over the map, and map rendering no longer draws caravan, faction event/zone, samosbor risk/shelter, wrong-door, route-cue, cartographer, cult-procession, seroburmaline or residue-specific overlays. Players can switch to `Выкл всё`, `Минимум`, `Бой`, `Маршрут` or `Полный` presets and then adjust individual surfaces. Damage/sleep feedback, active samosbor text, weapon/tool beam visuals and title/final screens are locked on, while location panel, route hints, FPS counter, stenographic HUD summary, status hints, anomaly deep hints and cosmetic screen effects can be toggled independently. Desktop title and in-game prompts explain mandatory click-to-capture mouse look before gameplay, `ЛКМ` as default attack and menu accept, `ПКМ` as default equipped tool and menu close, mouse wheel/menu up-down navigation, hold `Shift` for sprint, `F11`, `Tab`, `U`, `Enter` as game menu and keyboard menu accept, `Backspace` as default selected hotkey clear and Net Sphere erase, and `E` as default in-world interaction; losing pointer lock pauses the game behind the capture screen. `Esc` is not used by default for game windows because browser builds reserve it for browser escape/pointer-lock behavior, though the binding table can store `Escape`. The `Enter` game menu also links to key bindings, interface toggles and the graphics/FOV screen without releasing pointer lock by itself.

Localized floor messages use the toroidal world metric and enter the HUD/log only inside the current hearing radius, defaulting to 100 meters from the player. Heard NPC lines, AI actor messages and structured floor events carry distance in meters next to the timestamp; the radius is a runtime context value, and equipped hearing tools such as the liquidator radio headset can expand it without changing message pools. Structured floor events in the stenographic summary resolve distance from coordinates first, then actor/target id, room id or zone id.

## Implementation Snapshot

Current shipped-data scale, counted from source registries:

| Domain | Current count |
| --- | ---: |
| Story `FloorLevel` values | 6 |
| Authored routed design floors | 41 |
| Seeded procedural/fallback route floors per run | 54 |
| Procedural floor geometry / majority / anomaly profiles | 10 / 5 / 20 |
| Numbered lift anomalies | 8 |
| Main plot steps | 18 |
| Plot/side NPC ids after production manifests load | 377 |
| Side quest steps after production manifests load | 399 |
| System assignment templates | 205 |
| Item ids | 434 |
| Craft materials / item compositions / craft recipes / recipe sources | 9 / 434 / 434 / 23 |
| Physical weapon stat entries | 70 |
| PSI weapon stat entries | 18 |
| Base monster kinds | 67 |
| Monster ecology entries | 67 |
| Static rumors | 577 |
| Samosbor variants / modifiers / aftermath beats | 7 / 19 / 44 |
| Samosbor director beats | 33 |
| Economy resources | 17 |
| Caravan supply lanes / small caravan templates | 6 / 5 |
| Factory definitions / recipes | 12 / 42 |
| LIVING manifest entries | 35 |
| Manifest imports checked by content audit | 144 |
| Debug commands, including routed teleports | 130 |

`npm run content:audit` is intentionally conservative and reports static literal registrations: currently 377 plot NPC ids, 399 side quest steps and 135 literal contract entries. The runtime counts above include production manifest imports, dynamic route-floor side-quest registration and spread/composed contract arrays used by the running game.

## НЕТ-ТЕРМИНАЛ ГЕН

The current build includes an optional debug/diegetic current-floor map editor. Rare in-world `НЕТ-ТЕРМИНАЛЫ` can be used with `E`; without access they show `НЕТ-ТЕРМИНАЛ ГЕН НЕ ОБНАРУЖЕН`. A seed-fixed `Странный кусок плоти` appears once per run on one route floor, survives floor rebuild logic through run state, and unlocks terminal access when picked up. The debug menu can also grant access, place terminals, open the editor, replay the current floor patch, and clear the current patch.

The editor is a canvas HUD overlay over the live `World`: it can paint cells, doors, textures and features, spawn/delete entities and containers from live game registries, choose NPC faction variants, and replay compact current-floor patches after floor transitions, save/load and samosbor rebuilds.

`E` interaction now routes through a shared dispatcher used by desktop, HUD prompts and mobile context. A generic sparse interactive-surface layer in `src/data/interactive.ts`, `src/systems/interactive.ts`, `src/gen/interactive_placement.ts` and `src/gen/interactive_fixtures.ts` registers feature-like objects and adapters through one content hook: existing `Feature.SINK` cells become drinkable water sources lazily when targeted, existing `Feature.TOILET` cells can satisfy needs, generated sink/toilet fixtures can be marked as broken repair-pending interactives, explicit `workbench_basic` placement stamps a `Feature.MACHINE`, craft-station ids `craft_lathe`, `disassembly_workbench`, `craft_lab_bench` and `recipe_billboard` attach crafting/disassembly/recipe hooks to existing feature primitives, and visible `WorldContainer` cells are exposed through a container adapter while the existing container UI remains authoritative. This is a feature-first overlay: floor generation owns the visual primitive count and placement, while interactive definitions own the `E` behavior attached to those primitives. `src/data/floor_object_placement.ts` owns per-story-floor, per-design-route and per-procedural-geometry object profiles for decor features, explicit interactives, broken fixture overlays and craft-station subprofiles; `src/gen/floor_object_placement.ts` applies those profiles once at generation time through reachable bounded placement. Craft-station identity is marked in `world.surfaceFlags`, so packed floor memory can lazily recover station behavior when the matching feature survives. LIVING still seeds fixed reachable lathe/workbench pairs in the expedition prep point and Yakov Davidovich's lab; Maintenance collectors, `production_belt`, `slime_nii` and selected procedural geometries use the same object-profile path for pumps, lab apparatus, screens, broken sanitary fixtures and craft stations, with no runtime refill. Complex moving systems such as rail trains stay in their authored/anomaly generators because they own runtime state beyond static cell-bound objects. The surface layer stays transient; durable effects stay in existing needs, containers, events, room memory, surface flags, generated world state or the player crafting state. Generated floors also seed sparse interactable registries for gambling machines, local computers and НЕТ-hack terminals; these open canvas overlays, publish world events and mutate only local player/runtime state. NPC main-menu rows are built through a conditional option registry, so inventory-, route-, NPC- and quest-gated entries can open transient interfaces without changing save shape. A card-deck NPC option starts a two-player throw-in durak hand with a fixed 10% NPC-money stake, transient card state, cheap-card NPC heuristics and settlement through existing gambling events. A bone-dice NPC option appears when either side carries `dice_bone`, uses the same 10% NPC-money stake, plays a transient 21-point dice round and settles through the same gambling event types. A domino-box NPC option appears when either side carries `domino_box`, deals 7 double-six tiles to each side, uses draw/pass and blocked-round scoring, and settles through the same gambling event types.

`silicon_net_well` is a routed design floor at `z=-22`: a кремниевый НЕТ-колодец with Sibo, administrators, a cyborg scientist, special НЕТ-КОЛОДЕЦ terminals, Safeguard hack backlash and the rare `gravity_beam_emitter`. Failed special-console hacks publish `net_terminal_hack_failed` and spawn one Safeguard subject to cooldown; the GBE is a generic energy weapon that deletes a bounded beam line of cells, doors, containers and entities.

## Concept

The game is a survival-horror life-sim and stalker-like expedition shooter in a giant self-rearranging Khrushchev block. The world is a 1024x1024 torus. Rooms, corridors, macro-sectors, lifts, per-cell faction territories, local NPC utility intents, containers, quests, production, rumors and samosbor events all exist in the same persistent gameplay loop.

The player starts on `FloorLevel.LIVING` in the act hall. Nearby are Olga, Sergeant Barinov's armory range, a public starter locker, Yakov's lab, Vanka's den, a protected expedition prep point with a public loadout/checklist stash and the first living-zone POIs. From there the player makes expeditions: prepare food/water/ammo, take a quest or rumor, move through faction territory, fight or sneak, survive samosbor, loot containers, return with consequences.

Core loop:

1. Get a lead: plot quest, side quest, system assignment, rumor, faction event, production shortage.
2. Prepare: weapon, ammo, medicine, water, documents, PSI.
3. Travel: faction territory, rooms, lifts, POIs, monsters, NPCs.
4. Decide: trade, steal, repair, escort, kill, hide, forge, expose, reroute, flee.
5. Survive samosbor and aftermath.
6. Bring back loot, XP, reputation, money, story progress or trouble.

## A-Life Population

New runs create a compact in-memory pool around `100_000` procedural NPC records on every supported runtime, leaving unused headroom up to the `131_072` technical capacity for explicit arrivals and sanitizer clamps. A universal population plan assigns every created record to story floors, routed design floors and the per-run procedural floor deck before first active-floor generation. Only the current floor is materialized into live `entities`; other floors keep identity, floor assignment, family id, quest affordance, RPG traits, deterministic default loadout, death state and optional last known coordinates without running AI.

Persistent NPC generation uses data profiles in `src/data/alife_generation.ts`: faction weights, level tail, wealth tail, pockets and occupation mixes remain expandable without rewriting the runtime system.

Authored plot/side NPC packages can carry `homeFloorKey`, tags, age, sex, stats, inventory, sprite id, `spriteSeed`, optional `npcVisualId` and quests through the shared plot registry. Floor packages can register NPCs with `registerAuthoredNpc()` or `registerFloorSideQuest()`, so the A-Life population plan reserves named NPCs on their story/design/procedural route key from package data instead of a separate per-id hint table. Package reservations marked for population presence materialize through the same A-Life floor slots as ordinary inhabitants and apply sparse exact loadout/runtime defaults; event-only reservations remain event-owned. NPC visuals use one shared contract: `npcVisualId` can select a special procedural visual family for any authored or procedural NPC, `sprite` remains the atlas/static/fallback slot, and ordinary occupation sprites are generated only when no special visual or authored slot is present.

The persistent pool keeps full-population route and numeric fields in typed-array columns: `floorKey` is interned through a route-key dictionary plus `Uint16Array` index, while floor, danger, faction, occupation, flags, `level`, `str`, `agi`, `int`, HP, money/account balance, family id, sprite/sprite seed, kill counters, `playerRelation` and `karma` are not own JS number properties on every A-Life record. Untouched ordinary loadout is dynamically generated from seed/faction/danger/level by the universal procedural loot system (`procedural_loot.ts`) using the `ITEMS` registry as the single source of truth during materialization instead of storing `weapon` and `inventory` on every cold record; captured or overridden loadout remains sparse. Snapshot helpers expose ordinary route strings and numbers for UI, save, migration and materialization.

When a floor is generated, ambient generator NPCs are used as placement templates and replaced by A-Life NPC entities with stable `alifeId` / `persistentNpcId`. Materialized NPCs also carry personal `playerRelation`, initialized from faction attitude plus deterministic individual fluctuation, and `karma` in `[-127, 127]`, with faction-biased distribution. Before floor transitions, samosbor rebuilds and saves, live A-Life NPC state is folded back into the pool. Killed A-Life NPCs and killed `plotNpcId` NPCs do not respawn on later visits. Saves store the A-Life seed, up to `65_536` dead A-Life ids, dead plot ids, changed-record overrides and a capped A-Life mobility queue, not the full live entity array.

The player is an A-Life actor too: the player has `karma`, kill counters, rank score inputs and `playerRelation = 100` to self. The Faction/A-Life panel includes a cached `A-LIFE РЕЙТИНГ ТОП 100` with the player's own global rank among alive persistent NPCs.

The `Enter` game menu opens `Инфосеть Демос`, a tabbed NPC social surface over the same A-Life pool. It keeps cursor/search/tab/scroll as transient UI state, resolves the current profile from A-Life snapshots on demand, draws the top of the NPC's folded procedural or authored sprite as a portrait, and shows `alife:<id>` / optional `plot:<id>`, name, personal relation band, faction, occupation, level, route floor number, location, health, account balance, karma, traits, outgoing social links and quest affordance without pre-rendering the full population. The tabs are `Профиль`, `Связи`, `Лента`, `Пост` and `Квесты`; face-to-face NPC menus can open `Профиль Демоса` for materialized NPCs with an `alifeId`. A slow `demos_social_runtime` content hook consumes bounded recent `WorldEvent` slices and current-floor A-Life samples every 30 seconds, creates persistent compact posts/reactions in the `demosSocial` save section, creates runtime quest notices, applies small relation overrides through the Demos social API and may request at most one bounded social migration. Demos quest notices are read-only in the Demos UI: the player must visit and talk to the giver, where normal quest/contract systems create the actual quest and publish the handoff event.

Ordinary procedural NPC speech uses the bounded Markov speech layer. Plot/authored dialogue, side/design quest copy, exact combat alerts, samosbor safety instructions and structural `world_log.ts` telemetry remain exact text. Ordinary NPC talk, selected rumor flavor, procedural quest speech around already-created quest facts, non-critical ambient/lead/witness barks and Demos posts/reactions route through `systems/speech_router.ts` via focused adapters; render only draws ready strings.

Periodic background NPC/monster refill is disabled. NPC updates now come from current-floor AI, explicit faction/events/caravans, cold A-Life migration, samosbor rebuild materialization and quest/scripted spawns. The cold migration system processes a bounded record slice on a slow cadence, stores at most 512 journeys and 256 pending arrivals, moves inactive records directly, and materializes active-floor arrivals near lift anchors. Active departures walk live NPCs toward lift anchors before their records move. Caravans move resources, stability, tariffs and events, and small caravan runs can carry persistent `memberAlifeIds` so surviving members move to the destination route key. Monsters still appear through initial generation, samosbor, quests, lift encounters, hack backlash and authored consequences.

The detailed A-Life product and engineering contract lives in [alife.md](alife.md); the detailed Demos social surface contract lives in [demos.md](demos.md).

## Project Shape

```txt
src/
  core/
    types.ts        enums, interfaces, constants
    world.ts        toroidal typed-array World
    rand.ts         shared random helpers
  data/
    items.ts        item definitions, item tags and use effects
    weapons.ts      physical weapon stats
    psi.ts          PSI weapon stats
    plot.ts         PLOT_CHAIN, package-backed plot NPC helpers, side quest registry
    plot_rooms.ts   story room specs
    contracts.ts    system assignment templates
    resources.ts    economy resources
    caravans.ts     caravan lane definitions
    factories.ts    production definitions and recipes
    craft_*.ts      craft materials, station profiles, recipes and recipe sources
    item_composition.ts item-to-craft-material vectors
    banking.ts      bank route definitions and credit/deposit data
    stock_market.ts global/local quote definitions
    permits.ts      access papers and permit spoilage rules
    computers.ts    generated local computer definitions
    gambling.ts     generated gambling machine definitions
    net_hack.ts     local hack terminal definitions
    emergency_panels.ts emergency panel definitions
    interactive.ts  generic interactive surface definitions
    rumors.ts       static rumor definitions
    factions.ts     territory owner definitions and colors
    relations.ts    faction and occupation text/relations
    monster_*.ts    ecology, slime/zhelemish data
    design_floors.ts authored string-id floor route stops
    procedural_floors.ts floor geometry/faction/anomaly combinatorics
    floor_*.ts      catalog and numbered lift instances
    samosbor_*.ts   samosbor variants and director beats
    void_protocols.ts
  entities/
    monster.ts      monster registry and sprite map
    *.ts            monster definitions + sprite generators
  gen/
    floor_manifest.ts        FloorLevel -> generator map
    living/                  apartments, volatile maze, tutor room, hub geometry, zone POIs
    ministry/                administrative floor, macro geometry, ministry POIs
    kvartiry/                dense riot residential floor, social geometry, riot POIs
    maintenance/             collectors, tubes, macro geometry, industrial POIs
    hell/                    meat floor, organic geometry, heralds, cultists
    void/                    final void floor, folded geometry and protocols
    design_floors/           authored string-id route floor generators
    procedural_floor.ts      seeded interstitial floor generator
    procedural_screens.ts
    floor_object_placement.ts profile-driven decor/interactive placement
    craft_stations.ts bounded craft station placement
    interactive_placement.ts feature/container interactive placement helpers
    interactive_fixtures.ts  broken sink/toilet fixture placement helper
    shared.ts
  systems/
    ai/            NPC/monster AI, utility intent executor, combat, pathfinding
    alife.ts       persistent procedural NPC pool and floor materialization
    alife_migration.ts bounded cold A-Life journeys, active arrivals and departures
    demos.ts       A-Life NPC profile/search view-model and persistent Демос feed views
    demos_runtime.ts slow persistent Demos social/feed/notice/migration hook
    markov_text.ts / speech_router.ts bounded Markov NPC speech core and router
    net_sphere.ts  optional Cloudflare identity, heartbeat, stats, chat and event client
    samosbor.ts    siren, fog, seals, rebuild, boss/monster spawns
    events.ts      structured world event buffers
    quests.ts      plot, side, procedural and contract quest handling
    inventory.ts   inventory, trade, item use, weapons
    factions.ts    cell territory capture, hostility, faction events
    territory.ts   per-cell faction territory ownership and capture
    economy.ts     resource stocks and scarcity prices
    banking.ts     deposits, loans, interest and route bank state
    stock_market.ts quote ticks and global market impulses
    caravans.ts    supply lane slow ticks and tariff state
    production.ts  factory ticks into containers
    crafting.ts    player materials, known recipes, craft/disassembly actions
    containers.ts  world containers and theft/access rules
    interactive.ts sparse cell-bound interactive feature/container layer
    interactions.ts shared E-interaction dispatcher
    camera.ts      transient runtime camera modes and resolved CameraView
    computers.ts, gambling.ts, durak.ts, dice.ts, domino.ts, net_hack.ts generated/local gambling overlays and NPC table games
    emergency_panels.ts emergency panels and repair/report actions
    permits.ts     access checks, exposure and spoiled documents
    procedural_floors.ts per-run vertical route and floor specs
    floor_memory.ts runtime memory for visited floor Worlds/entities and lift anchors
    floor_instances.ts numbered lift anomaly state
    route_cues.ts  bounded audio/HUD path hints from generated markers
    map_exploration.ts UI-only minimap/full-map fog-of-war memory
    room_memory.ts local room facts from noise, violence and witnesses
    noise.ts       bounded sound records for doors, shots and footsteps
    rumor.ts       rumors from static data and events
    markov_*       speech adapters for dialogue, rumors, barks, procedural quests and Demos posts/reactions
    context.ts     dialogue context snapshot
    rpg.ts         levels, XP, stat scaling
    psi.ts         PSI effects
    weapon_beams.ts deletion beam weapon effects
    save_payload.ts / save_runtime.ts save payload and shape version
    debug.ts       debug menu
    debug_cheats.ts explicit debug-only cheats
  render/
    webgl.ts        raycaster and shader effects
    hud.ts          canvas HUD
    demos_ui.ts     Инфосеть Демос tabbed A-Life profile, links, feed, post and quest notice browser
    demos_feed_ui.ts bounded canvas feed panel for ready Demos post/reaction strings
    craft_ui.ts     craft/disassembly canvas overlay
    net_sphere_ui.ts Cloudflare stats/chat terminal overlay
    *_ui.ts         maps, quests, logs, containers, NPC menu, factions, computers, gambling, hacks, emergency panels
    sprites.ts      procedural sprite atlas
    textures.ts     procedural texture atlas
  input.ts
  main.ts           browser entry, game loop, save/load, floor transitions
```

Layer rule: `core` owns primitive state; `data` owns definitions; `gen` builds worlds; `systems` run generic behavior; `render` reads state and draws. Content modules should not hardcode themselves into `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI/system files.

## Floors

The authoritative floor map is `FloorLevel` in `src/core/types.ts`, story-floor generators in `src/gen/floor_manifest.ts`, authored design-floor route data in `src/data/design_floors.ts`, authored generators in `src/gen/design_floors/manifest.ts`, and procedural gaps in `src/data/procedural_floors.ts`.

**Floor Generation System:**
- **Even-numbered floors** (`Z % 2 === 0`) are separate, independent design modules. Each is authored as a standalone package without inheriting biomes.
- **Odd-numbered floors** (`Z % 2 !== 0`) are procedurally assembled by randomly mixing pieces of other floors and introducing procedural anomalies.

| Enum | HUD name | Generator | Role | Transition |
| --- | --- | --- | --- | --- |
| `MINISTRY = 0` | Министерство | `src/gen/ministry/` | documents, permits, offices, archives | story anchor `z=+30` |
| `KVARTIRY = 1` | Квартиры | `src/gen/kvartiry/` | dense social riot floor | story anchor `z=+14` |
| `LIVING = 2` | Жилая зона | `src/gen/living/` | start, hub, apartments, POIs | start story anchor `z=0` |
| `MAINTENANCE = 3` | Коллекторы | `src/gen/maintenance/` | industrial tunnels, water, repairs | story anchor `z=-26` |
| `HELL = 4` | Мясной низ | `src/gen/hell/` | high-threat meat/cult floor | story anchor `z=-36` |
| `VOID = 5` | Пустота | `src/gen/void/` | final anomaly/boss floor | story anchor `z=-50` |

Normal lifts move through a per-run vertical `FloorRun` route rather than directly through adjacent enum values. The player starts on `LIVING` at `z=0`; down decreases `z`, up increases `z`. The route spans 101 floors from `z=-50` to `z=+50`: `VOID` is the final lowest floor at `z=-50`, and `roof` is the highest floor at `z=+50`. The expandable target pattern is every even `z` as an authored/story slot and every odd `z` as a procedural floor. Until more authored floors exist, any unoccupied even slot also falls back to seeded procedural generation. The current span has 47 unique authored/story stops and 54 procedural/fallback floors.

Visited route stops are kept in bounded runtime memory under stable floor keys (`story:*`, design ids, procedural keys and numbered lift instance keys). Each key owns its own live `World` object and non-player/non-projectile entities: decals, bullet/blood marks, opened doors, containers and monsters belong to that exact floor and are restored only when the player returns to that same key. UI-only map exploration belongs to the live `World` during the current session; packed/save floor-memory restores geometry/entities, but exploration can restart when a packed snapshot creates a new `World`. Re-entering an unvisited stop still runs the generator from the run seed. After generation or memory restoration, normal route floors are postprocessed to the route lift contract: most floors get 16 down and 16 up lift cells, `roof` only gets 16 down, `VOID` only gets 16 up, and `podad` gets lower down lifts only after the Herald gate opens. A normal lift transition mirrors the departure lift group onto the arrival floor as the opposite return direction at the same coordinates; if the restored/generated floor has no reachable access there, normalization can carve a bounded connector so cross-floor lift continuity wins. Route lift interaction is on the `Cell.LIFT` block itself; adjacent `LIFT_BUTTON` features are not travel anchors and are stripped next to route lifts. Samosbor paths mutate the active floor locally from a random map source, defer the generated field splice through the two-phase loading screen, drop any stale parked copy for the same key, and the stitched world becomes the next stored snapshot when the player leaves.

Separate from the route lifts, every floor also gets an absolute fast-travel network: `src/gen/fast_elevators.ts` stamps a deterministic 8x8 grid of 64 fast-elevator cabins at fixed world cells (128-cell spacing, +64 offset) on every floor, on fresh generation and on memory restore alike (idempotent: same fixed cells every load). A cabin is a `Cell.LIFT` carrying `Feature.MACHINE`, which is the unique fast-elevator marker that the interaction, render and route-lift layers use to tell it apart from ordinary route lifts (route-lift normalization, counting and mirroring all skip `Feature.MACHINE` cells, so a cabin is never demoted or mirrored as a route lift). The grid is absolute by design: a cabin overwrites whatever occupied its fixed cell, is max-protected through `aptMask` so samosbor waves and volatile regrowth never erase it, and a short passage is carved to the nearest reachable floor so a cabin is never sealed inside solid wall. Using `E` on a cabin opens a fast-travel overlay that lists only the floors the player has already unlocked and jumps straight to the chosen `z` through a `targetZ` fast path on `switchFloor`. Floors unlock per run: a floor `z` is added to `FloorRunState.unlockedZs` when the player opens a fast elevator standing on it, so the start floor is unlocked from the beginning and the rest of the network grows as the player reaches new floors on foot. `unlockedZs` is saved with the run state and sanitized on load.

```txt
z=+50 roof
z=+49..+47 procedural
z=+46 chthonic_attic
z=+45 procedural
z=+44 radon_exchange
z=+43 procedural
z=+42 antenna_court
z=+41..+39 procedural
z=+38 pioneer_camp
z=+37 procedural
z=+36 cayley_byuro
z=+35 procedural
z=+34 upper_bureau
z=+33 procedural
z=+32 number_registry
z=+31 procedural
z=+30 MINISTRY
z=+29 procedural
z=+28 istinniy_labirint
z=+27 procedural
z=+26 bank_floor
z=+25 procedural
z=+24 critical_leak_archive
z=+23 procedural
z=+22 raionsovet_archive
z=+21 procedural
z=+20 markov_stairwell
z=+19 procedural
z=+18 registry_morgue
z=+17 procedural
z=+16 bolnichny_korpus
z=+15 procedural
z=+14 KVARTIRY
z=+13 procedural
z=+12 slime_nii
z=+11 procedural
z=+10 turing_nursery
z= +9 procedural
z= +8 manhattan_crossroads
z= +7 procedural
z= +6 voronoi_quarantine
z= +5 procedural
z= +4 communal_ring
z= +3 procedural
z= +2 moebius_podezd
z= +1 procedural
z=  0 LIVING
z= -1 procedural
z= -2 oranzhereya_betona
z= -3 procedural
z= -4 floor_69
z= -5 procedural
z= -6 obschezhitie_smeny
z= -7 procedural
z= -8 penrose_laundry
z= -9 procedural
z=-10 black_market_88
z=-11..-13 procedural
z=-14 production_belt
z=-15..-17 procedural
z=-18 service_floor
z=-19 procedural
z=-20 hyperbolic_switchyard
z=-21 procedural
z=-22 silicon_net_well
z=-23 procedural
z=-24 shahta_atrium
z=-25 procedural
z=-26 MAINTENANCE
z=-27 procedural
z=-28 harmonic_bathhouse
z=-29 procedural
z=-30 hilbert_depot
z=-31 procedural
z=-32 dark_metro
z=-33 procedural
z=-34 attractor_dvor
z=-35 procedural
z=-36 HELL
z=-37 procedural
z=-38 underhell
z=-39 procedural
z=-40 podad
z=-41 procedural
z=-42 spectral_chasovnya
z=-43 procedural
z=-44 cantor_pustoty
z=-45..-47 procedural
z=-48 darkness
z=-49 procedural
z=-50 VOID
```

`VOID` is reachable by the normal route at `z=-50` after the lower route opens. The return portal in `VOID` sends the player back to `LIVING` and the run continues in freeplay.

Route floors at `z<=-48` are NPC-free endgame spaces: `darkness`, the final procedural gap and `VOID` still generate monsters, loot, protocols and hazards, but no NPCs or faction event spawns.

When switching floors, the player preserves HP, needs, inventory, equipped weapon/tool, money and RPG stats. Visited floors restore from runtime memory or from packed save floor-memory entries when available; first visits, evicted snapshots and missing save entries regenerate from route data.

### Authored Design Floors

These are routed string-id floors, not new `FloorLevel` enum values. Each one is generated by `src/gen/design_floors/<id>.ts`. A design floor's `baseFloor` is the low-level engine save/instance bucket (which of the 6 story `FloorLevel` classes it occupies for `state.currentFloor`, save payload, floor-instance state and VOID endgame), while its content identity — visual palette, NPC density/faction/occupation mix and economy mood — is its own `themeClass` (`DesignFloorRouteDef.themeClass`, defaulting to `baseFloor`). Content systems read `themeClass` through `FloorThemeProfile.themeClass`, so a design floor can look and play as a different class than its save bucket without a save-shape change: for example `floor_69` keeps the `MAINTENANCE` save bucket but declares a `LIVING` `themeClass` so it renders with a residential palette fitting its adult-social identity. Design-floor generators are self-contained: they own their geometry, dynamics, mechanics and content, and do not import another floor's generators; the shared bureaucracy-generation helper lives at `src/gen/admin_common.ts` (neutral, not inside the Ministry story-floor folder).

`src/gen/design_floors/full_floor.ts` expands these authored modules into full 1024x1024 route floors with route-specific secondary layout algorithms, zone retuning, lights, doors and connectivity. The small authored rooms remain as named POIs inside the larger floor. After route geometry is finalized, `src/gen/design_floors/population.ts` applies a generic design-floor population field from `src/data/design_floor_population.ts`: NPC and monster targets derive from route `z`, `abs(z)`, base floor, danger and local overrides, then scatter through `sampleNaturalPopulationCells()` with `entitySpawnSlots()` caps. Broad NPCs are A-Life-compatible ambient templates; top/bottom extreme route floors can intentionally keep ordinary NPC target at zero while still adding monster pressure. `roof` also exposes a 1024x1024 dynamic sky provider backed by 16x16 cloud chunks; `render/webgl.ts` consumes it through a generic dynamic ceiling texture slot, and roof light comes from a uniform sky lightmap instead of placed lamps. `radon_exchange` is a Ministry route floor at `z=+44`: Radon/Hough-style scan lines, sparse blind wedges, real local shutter gates, a covered service chord and a stealable projection key that opens shortcut shutters. `spetspriemnik` is a Ministry route floor at `z=+40`: BSP cellblocks, a guarded patrol loop, barred sightlines, shelter cells, key/permit gates and bounded prisoner-release, name-trade, guard-bribe and riot choices. `istinniy_labirint` is a Ministry route floor at `z=+28`: a coarse toroidal maze with braided dead ends, station and micro-room clusters, five cell-first faction mini-HQ anchors, chalk-thread cues, landmark rooms, optional locked red-chord shortcuts, a lost NPC rescue branch and a document dead-end stash. `bank_floor` adds cash desks, a deposit row, credit window, debtor queue, staffed vault and a service bypass; banking choices currently use existing NPC quest and container systems with `banking` tags for deposits, loans, repayments, forged debt paper and vault theft. `critical_leak_archive` is a Ministry route floor at `z=+24`: a wet percolation archive with dry document islands, a contaminated shortcut, floodgate tools and dry archive packet trades. `bolnichny_korpus` is a Kvartiry route floor at `z=+16` for medicine, quarantine, wards and access checks. `slime_nii` now uses the design-route craft-station profile for reachable lab bench, lathe and disassembly workbench placement. `turing_nursery` is a Kvartiry route floor at `z=+10`: reaction-diffusion slime lanes, an inoculation basin, sample vault, burnable slime bridge and exposure-office decision path. `moebius_podezd` is a Kvartiry route floor at `z=+2`: two mirrored residential strips, paired seam landmarks, a safe public loop, a locked parity shortcut, reversed patrols and recoverable route-marker loot. `floor_69` keeps authored adult debt/refuge/blackmail actors and uses the shared design-floor social field for broad adult NPCs, guard/staff/clinic/debt weighting and low monster pressure. `production_belt` now uses the design-route craft-station profile for reachable industrial lathe/workbench placement. `silicon_net_well` is a Maintenance route floor for NЕТ access, silicon life and hackable NЕТ-колодец terminals. `dark_metro` has fixed-route moving trains: they stop at platforms, allow `E` boarding/exit, carry the player between stops and crush living entities on active rails. `podad` is a Hell-route design floor at `z=-40` with living-tunnel, moving-wall and section-shift room tags; the generic topology anomaly systems read those tags and mutate local walls without making Podad a one-off runtime path. `spectral_chasovnya` is a Hell-route design floor at `z=-42` with standing-wave rooms, acoustic-shadow side paths, bell/radio route cues and a bounded bell interaction that publishes existing noise/event facts instead of running an acoustic solver. `cantor_pustoty` is a Void route floor at `z=-44`: recursive concrete islands, repaired narrow bridges, tool supplies, route cues and risky dust-island stashes with no ordinary NPC population. `darkness` is the separate endgame route floor at `z=-48`; its generator clears baked light sources and the renderer uses zero ambient there, so only player/tool mechanics can illuminate it.

`number_registry` is a Ministry route floor at `z=+32`: a residue-labeled registry with modular corridor lanes, Chinese-remainder intersections, a bribeable modulus clerk, a risky prime shortcut and a safer composite public route.

`markov_stairwell` is a Ministry route floor at `z=+20`: a generation-time Markov chain of stairwell rooms with readable sequence tells, a locked service-door bypass, a pattern stash and a rare-state safe.

`cayley_byuro` is a Ministry route floor at `z=+36`: six permit-state offices wired as a Cayley graph, paid generator-R doors, a forged quotient shortcut and an identity-exposure branch.

`voronoi_quarantine` is a Kvartiry route floor at `z=+6`: Laguerre-style quarantine cells, document gates, escort pressure and supply connectors.

`oranzhereya_betona` is a Living route floor at `z=-2`: a concrete greenhouse with water/food supplies, spore pressure and scarcity choices.

`obschezhitie_smeny` is a Living route floor at `z=-6`: shift dormitory rooms, sleep/shelter decisions, quiet theft and witness pressure.

`penrose_laundry` is a Living route floor at `z=-8`: a finite aperiodic laundry/boiler patch with matching-symbol route cues, a breakable laundry lock, steam-diversion quest and hidden washroom cache.

`hyperbolic_switchyard` is a Maintenance route floor at `z=-20`: Poincare-like service arcs, false platforms, transfer choices and switchyard route cues.

`shahta_atrium` is a Maintenance route floor at `z=-24`: a central abyss, ring walkway, exposed bridges, service-rim bypass, repairable bridge chord, cover islands and route cues for quick crossing versus safer spiral movement.

`harmonic_bathhouse` is a Maintenance route floor at `z=-28`: scalar heat/steam/water bands, valve pressure hazards, a hot fast path, a cold flooded bypass and local repair-panel choices.

`hilbert_depot` is a Maintenance route floor at `z=-30`: an indexed storage floor where a generation-time Hilbert curve defines the safe cargo order, locked chord shortcuts cut across distant indices, route cues teach `Г-000 -> Г-008 -> ...`, and stealable indexed cargo stays in compact container state rather than saved curve data.

`attractor_dvor` is a Maintenance route floor at `z=-34`: flow corridors, switch panels, patrol loops and attractor-field route pressure.

| z | Route id | HUD name | Base floor |
| ---: | --- | --- | --- |
| 50 | `roof` | Крыша | `MINISTRY` |
| 46 | `chthonic_attic` | Чердак техслужб | `MINISTRY` |
| 44 | `radon_exchange` | Радоновый обменник | `MINISTRY` |
| 42 | `antenna_court` | Антенный двор | `MINISTRY` |
| 40 | `spetspriemnik` | Спецприёмник | `MINISTRY` |
| 38 | `pioneer_camp` | Пионерлагерь | `LIVING` |
| 36 | `cayley_byuro` | Бюро Кэли | `MINISTRY` |
| 34 | `upper_bureau` | Верхнее бюро | `MINISTRY` |
| 32 | `number_registry` | Числовой реестр | `MINISTRY` |
| 28 | `istinniy_labirint` | Истинный лабиринт | `MINISTRY` |
| 26 | `bank_floor` | Банковский этаж | `MINISTRY` |
| 24 | `critical_leak_archive` | Архив критической протечки | `MINISTRY` |
| 22 | `raionsovet_archive` | Райсовет и архив картотек | `MINISTRY` |
| 20 | `markov_stairwell` | Марковская лестница | `MINISTRY` |
| 18 | `registry_morgue` | Морг регистраций | `MINISTRY` |
| 16 | `bolnichny_korpus` | Больничный корпус | `KVARTIRY` |
| 12 | `slime_nii` | НИИ слизи | `KVARTIRY` |
| 10 | `turing_nursery` | Ясли Тьюринга | `KVARTIRY` |
| 8 | `manhattan_crossroads` | Перекрестки | `KVARTIRY` |
| 6 | `voronoi_quarantine` | Вороной-карантин | `KVARTIRY` |
| 4 | `communal_ring` | Коммунальное кольцо | `KVARTIRY` |
| 2 | `moebius_podezd` | Мёбиус-подъезд | `KVARTIRY` |
| -2 | `oranzhereya_betona` | Оранжерея бетона | `LIVING` |
| -4 | `floor_69` | Этаж 69 | `MAINTENANCE` |
| -6 | `obschezhitie_smeny` | Общежитие смены | `LIVING` |
| -8 | `penrose_laundry` | Прачечная Пенроуза | `LIVING` |
| -10 | `black_market_88` | Черный рынок 88 | `LIVING` |
| -14 | `production_belt` | Производственный пояс | `MAINTENANCE` |
| -18 | `service_floor` | Служебный этаж | `MAINTENANCE` |
| -20 | `hyperbolic_switchyard` | Гиперболическая стрелочная | `MAINTENANCE` |
| -22 | `silicon_net_well` | Кремниевый НЕТ-колодец | `MAINTENANCE` |
| -24 | `shahta_atrium` | Шахта-атриум | `MAINTENANCE` |
| -28 | `harmonic_bathhouse` | Гармоническая баня | `MAINTENANCE` |
| -30 | `hilbert_depot` | Склад Гильберта | `MAINTENANCE` |
| -32 | `dark_metro` | Темная пересадка | `MAINTENANCE` |
| -34 | `attractor_dvor` | Аттракторный двор | `MAINTENANCE` |
| -38 | `underhell` | Нижний пропускник | `HELL` |
| -40 | `podad` | Подад | `HELL` |
| -42 | `spectral_chasovnya` | Спектральная часовня | `HELL` |
| -44 | `cantor_pustoty` | Кантор пустоты | `VOID` |
| -48 | `darkness` | Темный отсек | `VOID` |
| 0 | `tutorial_apartments` | Обучающие квартиры | `LIVING` |
| -22 | `collapsed_sector` | Обрушенный сектор | `MAINTENANCE` |
| -38 | `liquidatorbase` | База ликвидаторов | `HELL` |
| -40 | `horrorfloor` | Ужасный этаж | `HELL` |
| -44 | `cavefloor` | Пещерный этаж | `VOID` |

### Procedural Floor Combinatorics

`src/data/procedural_floors.ts` defines the data deck for random interstitial floors:

- geometry type: `living_blocks`, `apartment_pressure`, `communal_knots`, `attic_weatherworks`, `archive_warrens`, `collectors`, `workshops`, `service_spines`, `sump_causeways`, `admin_pockets`;
- main faction: citizens, liquidators, cultists, wild or scientists, with citizens weighted highest and cultists lowest;
- anomaly: none, teleport cells, smog, samosbor seed, mushroom mycelium, Hladon cold pocket, false safe block, mirror run, radio chess, conveyor sorter, fractal floor, cement memory, wall snake, living tunnels, rail trains, zombie apocalypse, section shift and Conway life;
- danger level: `1..5`, derived from vertical depth, direction and random seed;
- per-floor loot and monster bias ids derived from the same seed.

`src/systems/procedural_floors.ts` owns save/load state for the run seed, current `z`, visited route keys, authored route entry resolution and lift route resolution. `src/gen/procedural_floor.ts` builds procedural floors without spawning authored story NPCs: rooms/corridors, both lift directions, zone danger, faction majority, seed-biased loot, seed-biased monsters and anomaly effects. Citizen-majority floors add public kitchens, shelters, witness pockets, shared-supply/trade/theft containers, escort route cues and citizen-biased generation-time NPC placement without runtime refill.

Teleport-cell anomaly pairs are stored sparsely in `world.anomalyTeleports`. Stepping on one paired cell moves the player to the paired cell after a short cooldown. Mushroom-mycelium floors also seed bounded carnivorous fungus rooms with corpse/bait feeding, salt/reagent neutralization, fire burn-off and risky zhelemish harvests. False safe blocks stamp quiet corridors, a too-clean shelter, black-hand marks, a missing-siren panel and cult-owned supplies; investigating, reporting, looting or breaking the marker publish events, while samosbor pressure is only partially delayed. Hladon cold pockets are bounded procedural rooms with pale frost marks; they slow and drain needs only inside/near the marked cells, and heat items, valve/steam tools or alternate routing counter them. Living-tunnel anomalies seed multiple root apparatuses across the generated floor; each root continuously carves a short moving organic tunnel while its tail restores the previous cell state, so the route opens and closes without full-world runtime scans. Sealant, jackhammer or UV use on a root pauses its local growth and collapses part of the old trail. Rail-train anomalies cut fixed rail routes through the floor, add platforms with schedule screens, spawn moving train segments, allow `E` boarding/exit while stopped and publish rail events when trains crush NPCs, monsters or the player. The old Bad Apple world prototype is retained only as disabled experiment source: it proved that the engine could stamp a 144x108 packed video rectangle and sync low-fi audio, but the frame/audio packs no longer ship in main builds. Zombie apocalypse floors fit their resident crowd and zombie pressure into the shared 4096 active actor ceiling; patient zero uses an available monster slot or upgrades an existing generated zombie, and any NPC bitten by a zombie becomes another zombie. Zombie-apocalypse generation now stamps gapped quarantine rings, crowd-funnel and infection-zone cues, reachable medical counterplay pockets and a bounded infection-conversion cap instead of runtime refill.

Floor VISIT quests only complete on story anchors, not on procedural or design floors that happen to use the same base `FloorLevel` for system mood.

### Numbered Lift Instances

`src/data/floor_instances.ts` defines 8 data-only numbered lift anomalies:

| Number | Title | Base floor |
| --- | --- | --- |
| 404 | Не найден | `LIVING` |
| 556 | П-46 | `KVARTIRY` |
| 777 | Счастливый | `LIVING` |
| 1337 | Элитный | `MAINTENANCE` |
| 013 | Служебный | `MINISTRY` |
| 089 | Теплый лифт | `MAINTENANCE` |
| 000 | Нулевой список | `VOID` |
| 912 | Чужая очередь | `KVARTIRY` |

These are not new `FloorLevel` values. The system can interrupt either story or procedural lift travel, stores anomaly state in save data, publishes `elevator_anomaly` / `elevator_loop_exit`, exposes HUD/map/debug labels and can become a rumor source. When a numbered lift interrupts a procedural route, the intended `FloorRun` target is kept so the next lift can exit back to that target.

Normal lift arrivals can rarely warn of a lift arachna in the shaft. The warning is delayed and counterable: look up, leave the lift area, or use loud shotgun/fire/noise before the drop. If it drops, it spawns one named bounded threat near the lift without transition damage.

### Future Floor Catalog

`src/data/floor_catalog.ts` is a data-only catalog for future pockets and numbered floors. It can be queried by `src/systems/floor_catalog.ts`, but catalog entries do not generate floors until a real generator and transition hook exist.

## Starting Area

The player spawns in the **Актовый зал** on `LIVING`. It is a protected room with desks, slides, Olga Dmitrievna and a public corner locker with low-level starter loot. The neighboring **Оружейная** is Sergeant Barinov's firing range: metal walls, targets (`Tex.TARGET`) and 9mm ammo on the floor.

Yakov Davidovich's lab is generated farther from spawn as a separate content module and contains a guaranteed lathe/workbench craft pair. Vanka's den is another story POI. The path to them is real gameplay, not just tutorial text.

The act hall and adjacent protected rooms use `aptMask`, so local samosbor waves do not erase them.

Slide textures rotate through 8 frames / 4 pairs:

1. Welcome and block number.
2. Collective labor slogan.
3. Samosbor/hermodoor instructions.
4. Purple fog warning.

## Story Chain

The main plot is data-driven through `MAIN_PLOT_NPC_PACKAGES` in `src/data/npc_plot_packages.ts` plus `PLOT_CHAIN` and side quest registration in `src/data/plot.ts`. Story rooms live in `src/data/plot_rooms.ts` and floor generators under `src/gen/*/`.

| # | Giver | Type | Objective | Main reward |
| --- | --- | --- | --- | --- |
| 1 | Ольга Дмитриевна | TALK | talk to Sergeant Barinov in the armory | Makarov + 9mm |
| 2 | Сержант Баринов | TALK | report back to Olga | bandages, water, bread |
| 3 | Ольга Дмитриевна | TALK | visit Yakov Davidovich | `psi_strike` |
| 4 | Яков Давидович | FETCH | bring an idol of Chernobog | `psi_mark`, medicine, money |
| 5 | Яков Давидович | TALK | find Vanka Banchiny / Ivan Zakharov | antidepressant |
| 6 | Ванька Банчиный | KILL | kill a Shadow | `psi_recall` |
| 7 | Ванька Банчиный | FETCH | bring strange clot to Yakov | medicine |
| 8 | Яков Давидович | TALK | go to Major Grom in Maintenance | `psi_rupture`, money |
| 9 | Майор Громный | KILL | kill 10 monsters near the outpost | AK-47, 7.62 ammo |
| 10 | Майор Громный | KILL | destroy Mancobus | `psi_storm`, ammo, money |
| 11 | Майор Громный | VISIT | hold the Hell anchor zone for 300 seconds | bandages, antidepressants, ammo |
| 12 | Майор Громный | VISIT | descend to Podad at `z=-40` | 7.62 ammo, bandages |
| 13 | Никанор Обожжённый | TALK | find Marfa at the Podad Herald threshold | `psi_phase`, holy water |
| 14 | Марфа Пороговая | KILL | kill three Heralds in Podad | `psi_void_needle` |
| 15 | Марфа Пороговая | VISIT | descend by normal lifts to `z=-50` | PSI stabilizer, holy water |
| 16 | Жан Пустотник | FETCH | bring the bottled voice | PSI stabilizer |
| 17 | Жан Пустотник | KILL | kill the Creator | void spike |
| 18 | Жан Пустотник | FETCH | leave the void spike before return | holy water, medicine |

Quest markers appear on minimap/full map. TALK points to target NPC, VISIT to room/floor target, FETCH generally back to the giver unless the quest has a specific target. The quest log can mark one unfinished quest as active with `Enter`; pressing `Enter` on the same quest clears it, and the minimap plus `M` full map draw a short second yellow player-relative hand beside the player direction marker toward that active quest's concrete target when it is on the current floor.

The minimap and `M` full map use UI-only exploration memory from `src/systems/map_exploration.ts`. A new/current floor starts with walkable geometry in the player's starting macro-zone revealed, including rooms, corridors, doors, lifts, water and abyss cells. After that, player movement reveals only a small local cell trail; entering a room or zone does not reveal that room or zone by itself. Active quest targets can still reveal their target room, target NPC, target monster radius or explicit item target through the quest marker path. The living-zone cartographer's paid living map can reveal one bounded fog-of-war area through the same exploration memory. Route-cue, samosbor shelter and faction-event systems no longer reveal or draw private map-only markers, and paid cartographer knowledge does not create a separate map overlay. Unexplored geometry is dark on both map modes, with a short visual-only feather on non-wall cells at explored borders so unknown passages fade into darkness while hidden wall mass stays black, and hidden cells do not show ordinary entity dots. Already explored cells age into a darker intermediate fog-of-war if the player has not recently seen them: geometry remains readable, but live NPC/item dots and NPC labels disappear until revisited, while stale lit cells can flicker and hidden dangerous actors can produce sparse red blurred pulses. The map legend/settings screen can keep the default palette or enable a high-contrast palette for rooms, corridors, doors, lifts, water and faction colors. This does not modify `World` solidity, raycaster visibility, AI vision, BFS, pathfinding or faction logic.

Procedural NPC assignments have deadlines instead of a global active-quest cap. The shortest rare urgent tasks, such as a nearby danger cleanup during samosbor, get at least 1 in-game hour. Normal procedural work is usually around a day. Cross-floor, high-rank, multi-kill or high-count assignments can run for several days. Plot-chain quests and most hand-authored side quests registered through content modules do not expire unless a module explicitly sets a deadline.

## Side Quests And System Assignments

Side quests use `registerSideQuest()` from `src/data/plot.ts`. Content modules register NPC definitions and quest steps at module import time. With production floor and design-floor manifests loaded, the current runtime registry has 377 plot/side NPC ids. `SIDE_QUESTS` has 399 steps across base data and `src/gen/`.

Major side-content locations include:

- `living/`: temple, Istotit supply cache, library, market, black market 88, mushroom cellar, zhelemish cellar, zhelemishnik, carnivorous fungus room, Spore Carpet cache, fake zhelemish medpost, concierge/radio/kitchen pack, domkom/laundry pack, domkom ammo locker, emergency medpost, expedition prep, external-cell neighbor, govnyak smoke den, cartographer room, hermoseam station, school ОБЖ, hospital quarantine, white compulsion room, Belaya Prislushka, Veretar window room, scientist escort sample, Golos za dveryu, Plombirovshchik, Samosbornyy Ostov and art studies.
- `ministry/`: permit office, weapon permit bureau, document gate, stamp room, interrogation room, queue hall, inspection archive, raionsovet archive, liquidator archive, NII contraband audit, Chernobog docket handlers, refusal clause, secret smoking room, Kartotechnik archive, Matka Dokumentov room, routed ministry design-floor content and named NPC pack.
- `kvartiry/`: ration queue, Ocherednik, water riot, ammo smelter, illegal print room, barricade, false neighbor, Pustoy Sosed, communal kitchen feud, cult supply kitchen, Chernobozhiy Svod, lost child corner, medicine swap, red corner, KV08 route assembly and named social NPCs.
- `maintenance/`: forpost, Mancobus room, flooded lab, pressure station, steam valves, diver cache, water bridge, Olgoy meat cache, Vodyanoy Koshmar pump room, Paritel steam bridge, watermeter post, overflow sluice, heatline zero, metro error line, concentrate press, Pressovik, Nasosnaya Matka, lift repair shaft, Remontnik bez smeny, charge cage 089, automation cage, Hladonets, Kabelnik, collectors pressure reroute, defector liquidator, Ostavshiysya Likvidator, NII slime sample post, blue glow sample, green acid room, brown slime cleanup room, slime deactivation furnace, slime singing vents, Ventshun, red adhesive trap, cult-held workshop, Seroburmaline no-look route, pneumomail station, black slime eyes, Chernaya Lichinka, Betonoed shortcut, Kostorez locker and Filtronos.
- `hell/`: Nikanor/Marfa plot rooms, Meduka, altar arena, choir tax, PSI meat cache, thin wall chapel and Myasomer.
- `void/`: Jean's warning cell, bottled voice, protocol chamber, borrowed light rule chamber, trace seal protocol, Maronary Signalshchik, Pristav Pustoty, Perestanovshchik, Seryy Smotritel and Ekrannik.

System assignment templates live in `src/data/contracts.ts`; quest generation treats them as normal system-assignment templates with scarcity-adjusted rewards and deadlines. The current runtime deck has 205 templates, including expedition, small-caravan escort/raid/reroute work, scarcity, monster cleanup, civil-minister directives, Ministry document-window work, minor-cult errands, govnyak courier and pneumomail-linked work. Debug can create/list system assignments, but the player-facing NPC action remains `Задание`.

On `KVARTIRY`, the false-neighbor/Pustoy Sosed content uses a screen-reflection tell and local side-quest branches: expose by checking papers/reporting to liquidators, flee by taking the complaint and leaving, or force a close reveal and fight. Resolved branches publish `false_neighbor` world-event data and rumor hooks.

## World And Data Model

- The world is a 1024x1024 torus.
- Dense per-cell state is typed arrays on `World`: cells, wall/floor textures, features, light, fog, room map, zone map, masks and marks.
- Sparse per-cell data is reserved for rare state: doors, containers, interactive surfaces, surface marks, decals and anomaly teleport links.
- Entities are flat plain objects in one array. There are no entity subclasses.
- Entity population soft limits live in `src/data/entity_limits.ts`: 4096 active NPC+monster actors per current floor, shared without type buckets, plus one shared 65536 floor-object pool for item drops, projectiles and billboards. Generation, quest/event, editor and debug spawns use `src/systems/entity_limits.ts` before adding more.
- Floor-wide population/content placement goes through `src/gen/population_placement.ts`: generation builds a dense 1024x1024 placement field from room weights, zone weights, optional anchors and value noise, smooths it locally over neighboring floor cells, then samples the field with coverage strata. This is generation-time scattering, not a runtime bucket cap. Current high-density NPC/monster paths for Kvartiry, Hell and procedural floors use this field approach.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2` for all toroidal coordinate work.
- Prefer `dist2` when only comparing range.
- Sparse cell hazard sites can be actor-visible but not fully actor-symmetric: NPCs and monsters can be trapped, escape or receive capped hazard damage, while some direct damage fields are configured as player-pressure traps.

Cell types: `FLOOR`, `WALL`, `DOOR`, `ABYSS`, `LIFT`, `WATER`.

Features include lamps, tables, chairs, beds, stove, sink, toilet, shelves, machines, apparatus, lift buttons, desks, slides, candles and screens. Gameplay-specific feature interactions use string `InteractiveDef` ids over these visuals instead of adding a new `Feature` enum value for every sink, workbench or device variant.

Room types: living, kitchen, bathroom, storage, medical, common, production, corridor, smoking, office, HQ.

Doors have five states: open, closed, locked, hermetic open, hermetic closed.

## Generation

### Living

`src/gen/living/index.ts` orchestrates:

1. `generateApartments()`: 128 permanent apartment clusters on a 16x16 supergrid, 5 layout variants, protected by `aptMask`.
2. `generateTutorRoom()`: act hall and armory.
3. `generateYakovLab()` and `generateVankaDen()`.
4. `generateZones()` and zone danger levels.
5. HQ room stamping for faction zones.
6. `generateVolatileMaze()`: volatile giga-maze.
7. `runZoneContentModules()`: registered zone POIs.
8. `buildLivingHubGeometry()`: readable hub routes and district motifs over the generated maze.
9. Vanka shadows, side quest NPCs, procedural screens, room items, families and travelers.

Living samosbor uses the same local wave contract as other floors: apartments and protected content survive, while only the affected local field is mutated and stitched from fresh generated geometry.

### Ministry

`generateMinistry()` builds a grand administrative labyrinth: axial public halls, nested rings, queue switchbacks, archive/service backroutes, locked authority shortcuts, marble courtyards, DFS corridor filler, offices, archives, red carpets, marble walls, parquet, portraits, procedural screens and administrative content manifest.

Ministry content is grouped behind `src/gen/ministry/content_manifest.ts` to keep the generator stable.

### Kvartiry

`generateKvartiry()` creates a dense residential riot floor from a wall-source grid and keeps that percolation layout intact. Initial population comes from `KVARTIRY_POPULATION_PROFILE`: 2381 citizens, 1349 wild residents and 238 liquidators, all with AI inside the shared 4096 NPC+monster actor ceiling after authored/content actors are counted. Spawn placement is context-weighted: rooms, public corridors, zone factions and smooth density noise bias independent floor-cell picks across the whole floor. Runtime population refill is disabled; social-pressure POIs and ambient unrest can trigger local uprising checks on the existing profile cadence.

### Communal Ring

`generateCommunalRingDesignFloor()` is the authored route-floor коммуналка at `z=+4`: a ring corridor with four сквозные communal flat chains, shared kitchen/laundry/shower/pantry/notice services, wet samosbor aftermath, owned/public containers, 6 quest NPCs and 6 side quests. The full-floor expander keeps the route footprint wide with additional shared-service knots around the 1024x1024 floor.

### Obschezhitie Smeny

`generateObschezhitieSmenyDesignFloor()` is the authored Living-band shift dormitory at `z=-6`: bunk-room slabs, patrol corridors, a watch post, lockers, washroom, kitchen, smoking room and a sealed common shelter. It ships sleeping ordinary NPC templates, three authored NPCs, quiet theft/witness containers and three side quests for shelter tally, patrol silence and locker theft.

### Maintenance

`generateMaintenance()` creates DFS-like tube tunnels on a coarse grid, pipe walls, junction rooms, water and industrial spaces, then applies collector macro geometry. Additive content is grouped in `src/gen/maintenance/content_manifest.ts`. Charge cage 089 is a utility-room production POI whose energy-cell output lands in an owned container.

Heatline Zero is a static pressure POI: using the vent machinery on Maintenance can repair the line with asbestos cord, sealant and a manometer, force a risky shortcut with partial parts, or vent steam and fog on failure.

The pneumomail station is a static Maintenance POI with intake, intercept, jam and report panels. It emits bounded capsules that create true leads, false leads, warnings, contraband and one static system assignment through existing rumor, contract and event systems.

### Hell

`generateHell()` builds organic meat caves through an Ising-style field plus Hell macro geometry, Hell-tuned zones, cultists, liquidators, monsters, Hell plot rooms, the story foothold holdout room and faster population pressure. Initial counts come from `HELL_POPULATION_PROFILE`: 3387 monsters, 565 cultists and 80 liquidators, all with AI. Spawn placement uses the shared smoothed whole-floor placement field with zone/noise weights; route arenas remain anchors, but initial population is not piled into arena cells. Runtime population refill is disabled; additional pressure comes from samosbor, holdout waves, lift encounters, hack backlash and authored consequences. Hell exposes normal down lifts; after the holdout quest completes, Major Gromny binds to his reserved A-Life record, a bounded liquidator group receives persistent A-Life ids, and the group spawns near the nearest lift before pathing toward the anchor zone.

### Podad

`generatePodadDesignFloor()` builds the `podad` route floor at `z=-40`: Hell-like meat geometry with Nikanor, Marfa, three Heralds, only upper lifts by default and room-name tags for living tunnels, moving walls and section shifts. Generic procedural anomaly systems activate those tags on any world that contains them, so Podad's walls can grow, close and shift without special per-frame floor hardcoding. Killing the three Heralds unlocks lower route travel and adds reachable down lifts.

### Void

`generateVoid()` builds folded green/black island geometry, void zones, Jean's warning cell without an NPC, protocol rooms, about 1600 active guardians, loot and the Creator boss. The route-facing `generateFloor(FloorLevel.VOID)` path strips NPCs, so the default endgame space stays NPC-free while still running monsters/protocols. It is reachable on the normal `FloorRun` route at `z=-50` after the Herald path opens, and by debug teleport.

### Procedural Floors

`generateProceduralFloor(spec)` is the generic interstitial generator. It consumes one `ProceduralFloorSpec` from the run deck and creates a non-story floor from plain data:

1. Stamp a room graph from the chosen geometry profile.
2. Apply a generation-time 2D structure-family overlay for generic profiles when the active anomaly does not own geometry: cellular braid, prime-XOR registry, braided maintenance maze or factory islands.
3. Connect rooms with toroidal corridors and ensure connectivity.
4. Generate 64 zones, danger levels and main faction control.
5. Place up/down lifts.
6. Spawn NPCs from the main faction mix through the shared smoothed whole-floor placement field, except on NPC-free endgame route floors at `z<=-48`.
7. Spawn loot and monsters with seed-biased weights.
8. Apply the anomaly: fog, teleport pairs, samosbor-tainted zones/marks, mushroom growth with carnivorous fungus rooms, cold pockets, false safe blocks, fractal/mirror/radio/conveyor topology, cement memory, moving walls/tunnels, rail trains, Conway arenas, section shifts or zombie-apocalypse crowd/infection.

Geometry and anomaly authoring contracts for future agents live in `../gatbage/reference/procedural_floors/geometry.md` and `../gatbage/reference/procedural_floors/anomaly.md`.

### Procedural Screens

`src/gen/procedural_screens.ts` places rare wall-mounted screens in suitable rooms. Screens are visual ambient intel, not interactive UI. They use `Tex.SCREEN_BASE..SCREEN_BASE+31` and `world.screenCells`.

Signal categories come from `src/data/screen_signals.ts`: samosbor warning, ration/water shortage, faction control, elevator anomaly, Ministry queue, collector pressure and VOID protocol. Placement respects floor, room type, zone faction and nearby lifts. It avoids bathrooms, doors, tutorial slides, targets, posters and portraits.

## Samosbor

`systems/samosbor.ts` is the main horror cycle.

Current behavior:

1. Timer reaches zero.
2. A variant is chosen from `data/samosbor_variants.ts`.
3. Warning messages/events are published.
4. Siren plays unless the variant suppresses or replaces it.
5. Citizens/scientists hide through AI; liquidators and cultists keep acting.
6. A random mutable point on the current 1024x1024 map is chosen; its zone is captured by samosbor fog/light and the point seeds the local field.
7. Fog boss, corridor monsters and map-pressure monsters spawn; start monsters are not leashed to the captured seed.
8. Near the end, hermodoor sealing occurs with variant timing. A failed player shelter check applies direct pressure damage but no longer seeds a player-centered fog patch.
9. The fog/light field spreads through reachable floor/water cells in the accessible volume; walls and doors stop it. Outside active samosbor the field keeps spreading, but its gameplay effect is inert.
10. Active fog samples apply the current variant's effect: classic samosbor spawns monsters, Maronary rewrites actors/items/container contents/cell details, Veretar deletes actors/items/containers/cells into white residue, and Istotit heals or creates actors/items/features.
11. Once per active second, if the player is not accepted inside a sealed shelter, samosbor spawns a floor-appropriate monster in a bounded ring around the player, preferring blocked line-of-sight or another room, targets it at the player, and raises only underleveled spawns to at least one level above the player.
12. Once per active second, samosbor picks one random live non-projectile entity from the current map and moves it to a random walkable non-protected map cell; the player is only affected when that same random selection picks the player entity.
13. Every story, design, procedural and numbered-instance floor runs `systems/samosbor_wave.ts`: a bounded small/medium frontier mutates cells during the active phase, records a local rebuild field radius, preserves apartments, hermowalls, lifts and explicitly protected shelter rooms, then defers the freshly generated current-route field splice through the loading screen and applies it to that local area with boundary floor stitches, generated room traits, existing cell territory preserved where the local splice does not replace it and old fog preserved on still-walkable cells.
14. After end, doors reopen, aftermath may apply, local route cues inside the rebuilt field are pruned, and the active stitched world becomes the floor's next memory snapshot.

`data/samosbor_variants.ts` currently has 7 variants, 19 modifiers and 44 aftermath beats. Rare replacement variants include Maronary with green fog/light, an intentionally kept high beep/active ping identity, damaging green source glow, wrong-door residue and identity rewrites; Istotit with a low bell cue, golden fog/light, marked shelter rooms, healing/creation effects and social aftermath; and Veretar with white fog/light, deletion effects, area leakage and white residue. The player-facing philosophy is explicit in runtime mechanics: samosbor brings purple fog and monsters, Maronary changes, Veretar removes, Istotit creates. `data/samosbor_director.ts` currently registers 33 bounded director beats for warnings, patrols, shortages, door malfunctions, aftershocks and rumor seeds.

The `vacuum` tool clears samosbor fog/light from the player's cell and the eight neighboring cells, so the player can clean the active field edge without stepping deeper into it.

Samosbor timing is route-depth based. Duration is random from a 30-second minimum up to a depth-scaled cap, reaching 15 minutes at `abs(z)=50`. Cooldown is the inverse random interval: at the safe center it can reach 30 minutes, and at `abs(z)=50` it bottoms out at 1 minute.

Route cues live on the concrete `World` that registered them. Story, design, procedural and floor-instance loads keep their generated cue state with that world object. Runtime samosbor waves prune cues whose source/target cells fall inside the final local rebuild field.

Map exploration follows the local rebuild boundary visually only: a samosbor wave covers the rebuilt field area back with map fog-of-war. Re-entering that darkened local field reveals it through the same normal local cell trail as any other unknown map area. This is separate from purple fog density and from simulation visibility.

## Events, Memory And Rumors

`systems/events.ts` stores structured `WorldEvent` facts in fixed ring buffers:

- recent events: 512
- important events: 128
- per-zone events: 32 x 64 zones

Events cover samosbor, cell territory capture, fog bosses, floor transitions, elevator anomalies, lift arachna, item pickup/drop/use/sale/handoff/destruction, generic interactive surface use, tool breakage, ammo consumption, UV spotlight use, monster bait, quest/system-assignment creation/completion/failure, theft, containers, production, pneumomail capsules, ration coupon audits, shelter tallies, smog, route cues, faction events, monster windups/counterplay and kills.

`systems/world_log.ts` turns important public facts into HUD/log messages. `systems/npc_memory.ts`, `systems/context.ts` and `systems/rumor.ts` let NPC dialogue and rumor spreading react to those facts.

`data/rumors.ts` contains 577 static rumor definitions, and runtime events can become observed/spread rumors.

## NPC, A-Life And Factions

NPCs use `AIState` plus `NpcState`:

| State | Use |
| --- | --- |
| `SLEEPING` | visible state for sleep/rest intent |
| `MORNING` | visible state for toilet/personal upkeep intent |
| `WORKING` | visible state for work/profession intent |
| `LUNCH` | visible state for eat/drink intent |
| `FREE_TIME` | visible state for social, wander or low-pressure intent |
| `HIDING` | visible state for safety/flee intent and samosbor shelter |
| `TRAVELING` | visible state for traveler movement intent |
| `MEETING` | visible state for Ministry/social coordination intent |
| `PATROL` | visible state for patrol or combat-readiness intent |
| `BREAK` | legacy display label for short rest |

Occupations include housewife, locksmith, secretary, electrician, cook, doctor, turner, mechanic, storekeeper, alcoholic, scientist, child, director, traveler, pilgrim, hunter and priest.

Factions:

| Faction | Role |
| --- | --- |
| Citizens | ordinary residents, work/sleep/trade/quest |
| Liquidators | armed responders and patrols |
| Cultists | PSI-using samosbor-adjacent faction |
| Scientists | plot/research/medicine |
| Wild | raiders/social chaos |
| Player | separate faction for relation logic |

The world still has 64 macro-sectors for map/debug/event grouping, but faction ownership is cell-first: `world.factionControl` is the authority for the owner of each world cell. `systems/territory.ts` initializes that field from authored/generator control, guarantees small HQ/anchor patches for human factions, counts owned cells, applies bounded local capture and keeps sector metadata derived for compatibility. `systems/factions.ts` uses the cell field for territory strength, patrol/noise response, UI snapshots and hostile target logic. Ordinary NPC utility scores and patrol/wander targets bias toward friendly territory, while travelers, hunters, faction events and samosbor can push into hostile cells. `data/faction_events.ts` adds discrete faction events. Cult processions are rare timed faction events with capped pilgrims, residue marks, temporary local control pressure, HUD/log warnings, and player responses: avoid, follow, report by equipped radio, use a meat rune as disguise, or disrupt by violence. Active processions publish aftermath and end when a samosbor cycle starts.

Personal NPC relation to the player is separate from faction relation but uses the same hostile threshold. Attacking an NPC lowers that individual relation, and quest completion raises the giver's personal value more than the issuing faction's small normal gain (`+1`). An individual NPC can therefore become hostile or grateful even before the faction-wide matrix fully changes. Player karma starts at `0`; attacking non-enemies, stealing and urinating on owned floor reduce it.

NPC and monster broadphase uses `systems/entity_index.ts`: a 16-cell toroidal bucket index with live id, actor, needs and projectile lists. Static item-drop/billboard buckets are retained across simulation frames, while the per-frame dynamic rebuild walks actors/projectiles and newly appended entities instead of all floor loot. `updateAI()` then makes one full pass over the indexed live-AI list, excluding only the currently controlled player body from autonomous AI. This full-pass model is the AI baseline for the game: there are no hot/warm/cold actor tiers and no player-distance gate, so a debug-spawned monster at the end of the list, a remote NPC faction fight and a nearby resident all receive the same simulation frame. Combat target scans are cached through `combatTargetId` / `combatScanCd` and query nearby buckets instead of scanning every entity. Ordinary NPC decisions come from `systems/ai/npc_utility.ts` scoring local needs, threat, role, soft rhythm and current-intent stickiness; expensive rescoring uses each NPC's own short deterministic rethink timer, while the current intent keeps executing every frame. `NpcState` is only a display/debug label derived from the selected intent. Toilet relief now uses the same shared compact yellow organic surface trace as player urination; ordinary NPCs still route to bathroom targets, while Wild faction members intentionally pee in place as a narrow faction design experiment. The short combat step does not erase individual behavior: NPCs keep identity, faction, relation to the player, role, needs, loadout, current intent and target memory, but dense fights resolve through the same cheap faction target / move / hit-or-shoot loop. Ministry NPCs use the same utility executor with a ministry profile instead of a separate schedule. Moving monsters default to wandering, and actors with a combat target use `HUNT`. Pathfinding uses `systems/ai/pathfinding.ts`: a baked whole-floor BFS navigation tree over the 1024x1024 toroidal field, rebuilt when `world.cellVersion` or samosbor phase changes. Routine and combat path assignment read bounded chunks from that tree instead of launching per-actor BFS queues; ordinary closed doors are routeable and opened by movement, while locked and hermetic-closed doors block navigation. Shared A-Life destinations, such as nearest kitchen, toilet, workplace or shelter class, use cached behavior flow fields layered over the same geometry: each behavior supplies a source set, the field is baked once per geometry version, and many actors follow bounded chunks from it. Samosbor hiding now seeds per-NPC emergency shelter targets from current/home/assigned/nearby rooms with capped local scoring instead of only resetting every citizen to the same abstract hide goal. Large faction fights continue across the current floor through real HP, movement, blood, drops, events and physical projectiles; rendering proximity affects what the player sees, not whether the fight is simulated.

Profiled special behavior runs through `systems/ai/tactics.ts`: `updateAI()` calls one shared actor tactic runner for NPCs or monsters that have a registered profile, while unprofiled actors skip local tactic sensing. Profiles define bounded radius/cadence/cap values and cache transient local facts in `AIState`. The shipped `slime_woman` profile handles dry/wet cues, residue after combat stimulus, local-crowd flee, wet-anchor retreat and isolated-target ambush without full-map scans or content branches in `main.ts`.

## Items, Weapons And PSI

`src/data/items.ts` currently defines 434 item ids:

- food and drinks: bread, canned food, kasha, briquettes, water, tea, kompot, coffee, etc.
- medicine: bandage, pills, antidepressant, antibiotic, morphine, PSI stabilizer, sanitary kit, sleeping pills and route-risk treatments.
- weapons as items: knives, pipes, pistols, shotguns, rifles, tools, energy weapons, PSI clots.
- ammo: 9mm, shells, nails, 7.62, belt, energy cells, fuel, special ammo.
- tools: flashlight, repair kits, cleaning kit, vacuum, radio, fog detector, unpeople detector, pickaxe, jackhammer.
- armor: light/medium/heavy armor, faction armor, gas mask.
- materials: construction materials, collector key, minerals.
- documents and components: permits, forms, denunciations, seals, tickets, manometer, filters, wire, metal, electronics.
- plot and rare items: idol, strange clot, bottled voice, void spike, Maronary shaving, Veretar sand, overexposed photo and govnyak contraband.

Physical weapon stats live in `src/data/weapons.ts` and include 70 entries, including fists, melee tools, Soviet firearms, improvised firearms, energy weapons, grenade, flamethrower, harpoon gun, liquidator cleanup weapons and the deletion-beam emitter. PSI weapon stats live in `src/data/psi.ts` and include 18 entries, for 88 merged weapon stat entries. The detailed PSI design and possession contract is in [psi.md](psi.md).

PSI does not regenerate passively. It is restored by medicine/items and scales with INT through RPG stats from a 100-point base reserve. PSI clots keep executable weapon stats but equip through the tool slot, so the player and NPCs can carry a physical weapon and a PSI clot at the same time. Timed PSI effects use a shared 15-second base runtime plus 1 second per INT point: `psi_shield` blocks incoming current-player HP loss by spending 10% of blocked damage from PSI, and `psi_possession` swaps the runtime `player` entity to a lower-INT NPC/monster until expiry or failure. PSI is intended as game-changing magic - phase, mark, recall, control, possession, teleports and local reality shifts - rather than a damage-only weapon tier.

## Monsters

`src/entities/monster.ts` currently registers 67 standalone `MonsterKind` packages. The legacy starting set includes:

`SBORKA`, `TVAR`, `POLZUN`, `BETONNIK`, `ZOMBIE`, `EYE`, `NIGHTMARE`, `SHADOW`, `REBAR`, `MATKA`, `IDOL`, `MANCOBUS`, `HERALD`, `CREATOR`, `SPIRIT`, `ROBOT`, `SHOVNIK`, `LAMPOVY`, `PECHATEED`, `TUBE_EEL`, `PARAGRAPH`, `NELYUD`, `KRYSNOZHKA`, `KOSTOREZ`, `SAFEGUARD`, `GNOMES` (стайные мутанты), `STALKER_HUNTER` (живучий преследователь).

Standalone monster packages extend that registry. `LAMPOGLAZ` is a Living/Ministry light-linked turret: it shoots harder and faster when the target stands in lit cells or near lamps, and loses its windup when the target cuts line of sight or moves into darkness. `DIKIY_MERTVYAK` is a Kvartiry/Living fragile crowd-runner: early damage cancels its shove momentum, while door jams, queues and dense actors let it stagger/panic nearby NPCs. `VODYANOY_KOSHMAR` is a Maintenance water-line PSI predator: bounded slow wet-connectivity checks ramp pressure while the target stays on a connected wet line, and dry concrete creates a short interruption window. `TRUBNYY_AVTOMAT` is a Maintenance wet-line machine: it charges only along bounded wet/drain lines, can be denied by stepping dry or flanking, and has a long recovery after firing. `OLGOY` is a Maintenance/Hell meat worm: raw meat and corpses distract it, dry floor slows it, and water/pipe/abyss cells let it bite harder and drag targets. `GLUBINNAYA_TEN` is a Hell/Void delayed-shadow predator: chasing its dark afterimage triggers a second-beat strike, while holding position or using light collapses the bait. `SLIME_WOMAN` uses the shared actor tactic profile for residue, wet/dry counterplay, crowd flee and isolated-target ambush. `SPORE_CARPET` is a Ministry/Kvartiry/Living/Maintenance dormant floor ambusher: proximity, opened containers, noise and fire wake it; close puffs apply `spore_haze`, while flame burns delay the next puff and publish a route clue.

Monster supporting data:

- `src/data/monster_ecology.ts`: floors, rooms, counterplay, loot hints, rumor ids.
- `src/systems/ai/monster.ts`: behavior rules.
- `src/systems/ai/tactics.ts`: shared bounded actor tactic profiles for special NPC/monster behavior.
- `src/entities/*.ts`: stats and procedural sprites.

Mechanical modifier variants have been removed; new creatures are standalone `MonsterKind` packages with direct stats, sprite generation, ecology and AI hooks.

Fog bosses can clear fog when killed. Matka is a spawner boss. Heralds open the lower Podad route. Creator is the final boss.

Krysnozhka, Sborka, Tvar, Polzun and Tube Eel can be distracted by explicit bait: dropped food or used/dropped govnyak creates a temporary capped marker. Bait attraction uses active marker caps and cooldowns, not item-drop scans. Tube Eel route set pieces combine water cells, dry-edge counterplay, harpoon ammo and non-cleanable wet-route HUD warnings instead of fluid simulation.

Kostorez is a rare Maintenance/Hell melee elite with a visible blade windup. Distance, a corner/obstacle, or shotgun pellets interrupt the burst; a carried `metal_sheet` can absorb part of one cut. Zakalyonnaya Armatura is a rare Maintenance/Hell armored rebar elite: weak melee and panic pistol hits are resisted until shotgun, heavy melee, explosive or heavy ranged hits strip its armor stacks. Safeguard is a fast NET/BLAME blade guard used by `silicon_net_well` terminals and late-route NET backlash.

Several newer monster ideas are implemented as reachable floor content modules rather than new `MonsterKind` enum values. Examples: Golos za dveryu and Plombirovshchik on Living, Ocherednik and Pustoy Sosed on Kvartiry, Pressovik/Nasosnaya Matka/Hladonets/Kabelnik/Ventshun/Filtronos on Maintenance, Myasomer in Hell, and Ekrannik/Perestanovshchik/Pristav Pustoty/Seryy Smotritel in Void. These modules use existing entities, items, events, room marks, route cues and local mechanics instead of expanding the core enum for every named encounter.

## RPG And Needs

RPG stats:

- level
- XP
- unspent attribute points
- STR: melee damage `+1%` per point, melee weapon level bonus, max HP `+1` per point
- AGI: movement `+1%` per point plus asymptotic attack/spread improvement
- INT: max PSI `+1` per point plus asymptotic XP/reward/PSI-cost improvement
- current/max PSI

XP uses a soft quadratic formula in `systems/rpg.ts`. Runtime RPG level cap is `255` so level and attribute columns fit unsigned-byte storage; current per-level XP remains a normal number because the formula exceeds byte/uint16 range at high levels. Monsters and NPCs can scale by zone level.

Needs:

- food
- water
- sleep
- pee
- poo

The player manages needs manually through items and behavior. Passive HP regeneration restores up to 1% max HP per real minute at full food and fades with current food. NPC needs are restored by being in suitable rooms.

## Economy, Containers And Production

Economy:

- `src/data/economics.ts`: long-progression money bands, top-gear/PSI value floors, major reward tags and depth-aware procedural loot caps.
- `src/data/resources.ts`: 17 resources.
- `src/systems/economy.ts`: per-floor stock, scarcity multiplier, adjusted price cache.
- `src/systems/quest_rewards.ts`: canonical runtime reward calculation for procedural quests and system contracts from objective value, route depth, danger, giver level/wealth, scarcity and major-reward tags.
- `src/data/banking.ts` and `src/systems/banking.ts`: bank deposits, credit, repayment and interest state.
- `src/data/stock_market.ts` and `src/systems/stock_market.ts`: local quote ticks and optional Net Sphere market impulses.
- `src/data/caravans.ts` and `src/systems/caravans.ts`: 6 supply lanes, bounded slow ticks, tariff pressure, route actions and limited persistent caravan member movement.
- Scarcity affects item prices and runtime contract/procedural quest rewards.
- Money is carried as entity cash (`Entity.money`) for live trade; persistent A-Life NPCs also have `accountRubles`, and wealth is cash plus account balance.
- NPC trade uses one symmetric `Торг` screen: edge 5x5 inventories show player/NPC stock, center 5x5 baskets stage what each side gives and takes, and `Enter` commits one atomic transaction with scarcity-adjusted item values plus only the remaining cash delta.
- Current-version economy save data is sanitized on load, including missing floor/resource rows inside the accepted save shape.
- The debug menu has an economy prices summary for current stock and adjusted prices.

Containers:

- `src/data/container_defs.ts`: container generation definitions.
- `src/systems/procedural_loot.ts` - универсальная система генерации предметов, Единый Источник Истины для лута, опирающийся на веса, `value` и фракционные предпочтения.
- `src/systems/containers.ts` - генерация и доступ к контейнерам с лутом, использующая универсальный размер инвентаря на 64 слота. Количество лута в контейнере масштабируется процедурно от глубины этажа. Также обрабатывает правила доступа и кражи.
- `src/render/container_ui.ts`: two-inventory container UI.
- Actor inventory is an 8x8 physical slot grid; stackable slot counts are byte-capped at `255`, and larger pickups split across slots or fail capacity checks.

Production:

- `src/data/factories.ts`: 12 production definitions and 42 recipes.
- `src/systems/production.ts`: up to 64 production rooms per floor, outputs deposited into room containers.
- Production publishes `room_produced_items`, `room_lacked_resources` and `room_blocked_production`.

## Rendering And UI

Rendering:

- WebGL DDA raycaster.
- Procedural texture atlas.
- 128x128 sprites.
- Critters (rats/roaches/flies).
- Speech bubbles.
- Procedural sprite atlas for fixed props/projectiles plus seed-generated per-entity NPC/monster sprite textures. The renderer rebuilds 8192-entry procedural actor and current-floor item-drop texture caches at floor/game load boundaries so procedural visuals are generated before play resumes, not during hot frames.
- Item drops use procedural item-specific textures derived from the drop's `defId`; the same generator draws inventory/container icons without adding save payload fields.
- Per-cell wall/floor textures.
- Surface marks and blood/gore marks.
- Fog, glitch and HUD effects.
- Canvas overlays for all UI.
- `render/webgl.ts` receives a resolved `CameraView`; it does not choose player/death/free camera modes.

HUD/UI modules:

- `hud.ts`: main HUD and panels.
- `map_ui.ts`: minimap/full map.
- `quest_ui.ts`: quest log.
- `log_ui.ts`: message log.
- `npc_ui.ts`: NPC interaction menu.
- `container_ui.ts`: container transfer UI with item icons.
- `factions_ui.ts`: factions panel.
- `stats_ui.ts`: RPG/stat and inventory view with item icons.
- `menu_ui.ts`: save/load menu.
- `net_sphere_ui.ts`: optional Cloudflare stats/chat terminal.
- `computer_ui.ts`, `gambling_ui.ts`, `net_hack_ui.ts`, `emergency_panel_ui.ts`, `controls_ui.ts`: generated local interaction and controls overlays.

Screens show active floor/zone context, quest markers, fog overlay, NPC/monster/drop pips and current player status.

## Controls

`Tab` opens the in-game hotkey screen from normal gameplay and closes it again when no key capture is active. It lists every registered keyboard and mouse-button action, starts with a dedicated default-reset row, includes a mouse sensitivity slider, and lets the player add keys or mouse buttons to the selected action immediately. A key or mouse button can be assigned to multiple actions, and an action can have multiple inputs; capture accepts ordinary keys, `Space`, `Backspace`, `Esc` and mouse button codes such as `MouseLeft`/`MouseRight`. Bindings and sensitivity are stored in browser `localStorage` separately from the game save. The game uses `KeyboardEvent.code`, so defaults follow physical keys and keep working across keyboard layouts; the browser Tab focus action is prevented while the game input handler is active. Inside the hotkey screen itself, `Enter` activates the selected row or starts input capture, `Backspace` clears every input assigned to the selected action row by default, and `Enter` on the top reset row restores default bindings.

| Key | Action |
| --- | --- |
| `WASD` | movement |
| Mouse | mandatory look / pointer lock gate on desktop |
| LMB | default attack / shoot; accept selected row while a canvas menu is open |
| RMB | default equipped tool; close/back while a canvas menu is open |
| `E` | default in-world interaction: pickups, doors, NPCs, containers and other aimed world actions |
| RMB | universal close/back for ordinary canvas menus |
| `I` | inventory |
| `1` / `2` / `3` | spend STR / AGI / INT point in inventory |
| Arrow keys / `W` / `S` / `A` / mouse wheel in menus | menu navigation; right movement uses `ArrowRight` |
| `M` | open/close full map overlay; mouse wheel zooms it while open |
| `G` | open/close the separate map legend/settings screen; its options control what `M` and the minimap render, including high-contrast map colors |
| `Q` | open/close quest log |
| `L` | open/close message log |
| `F` | open/close factions |
| `N` | Net Sphere terminal; shows offline state when Cloudflare API is unavailable |
| `F1` | one-page HELP poster with survival basics, current hotkey hints and interface explanation |
| `Tab` | open/close hotkey/rebind screen |
| `U` | open/close UI and graphics settings |
| `Backspace` on hotkey screen | clear all keys assigned to the selected action |
| `R` | keyboard fallback for equipped tool; also restarts from game-over prompt |
| `X` in inventory | drop selected inventory item |
| `P` | pee |
| `Z` | sleep when allowed |
| `Enter` | open game menu from gameplay; universal accept/confirm in menus; send Net Sphere line without closing it |
| `Backspace` in Net Sphere | erase chat character |
| Mouse wheel / `PageUp` / `PageDown` / arrows in Net Sphere | scroll loaded chat history |
| `Delete` / RMB in Net Sphere | close Net Sphere |
| `F11` | browser fullscreen |
| `~` | open/close debug menu |

`Esc` has no default gameplay/window binding. In the browser build it still belongs to the browser and pointer-lock release path, though the hotkey table can store `Escape` like any other captured code. `Enter` opens the game menu from normal gameplay and confirms the selected row inside canvas menus, while LMB confirms the selected row only when a canvas menu is already open. RMB closes or steps back from open canvas menus including Net Sphere, and Net Sphere keeps `Space` as printable chat input only after its chat line is selected. `I`, `M`, `G`, `Q`, `L`, `F`, `F1`, `Tab`, `U`, `N` and `~` open their top-level panels only from normal gameplay; while any canvas menu is already open, another menu-opening shortcut does not switch panels. The same shortcut closes its own panel when no text input or key-capture field is active. `F1` opens and closes a single-page old-school HELP poster; `Tab` remains the full remappable binding table. `E` is the default world interaction binding for pickups, doors, NPCs and aimed interactables.

On touch devices the game shows the title immediately and defers initial world generation until the player starts the run. The landscape mobile overlay has a left virtual joystick for movement, right virtual joystick for controlled-player camera rotation, center tap zone for attack/shoot, left `[E]` popup for nearby interaction targets, a top-left `FULL`/direct-page control when the browser can use it safely, and a right-side menu rail. Desktop mouse sensitivity is configurable in the `Tab` hotkey screen and defaults to 130%; mobile camera sensitivity is configurable in the `U` UI menu and defaults to 50%. Desktop fullscreen is the same browser fullscreen path through the remappable `F11` action. The rail's up/down buttons choose inventory, map, quests, log, factions, Net Sphere, save/load menu or debug menu; the center button opens the selected panel or closes the current panel. The canvas resizes to the host viewport/fullscreen iframe, including itch.io mobile launch/fullscreen resizing. Canvas UI panels accept taps for selection, transfer, buy/sell, use/drop and close actions.

Debug menu currently has 130 commands including 41 routed design-floor teleports: weapons/PSI, spawn monsters/NPC/items, XP, samosbor variant cycle and small wave trigger, noclip, event log, economy prices, containers, production tick, system assignments, balance/catalog, lift instances, VOID protocols, faction events, route cues, samosbor director controls, story/design/procedural/anomaly teleports, Maronary/Istotit/Veretar forcing, govnyak courier, pneumomail, hermodoor borer QA, liquidator-cult clash, `ONEPUNCHMAN`, Net Terminal Gen/map editor commands, rail-train anomaly teleport, disabled Bad Apple experiment notice, zombie-apocalypse anomaly teleport, smoke expedition setup, expedition proof commands, permit debug commands and verification commands for contracts, events, lift route windows, numbered lift loops, samosbor warning, economy scarcity, floor monster packs and container routing.

## Save And Load

Save/load goes through browser `localStorage`. Saves include player state, age, sex, game clock, quests, current base floor, `FloorRun` state, numbered lift anomaly state, lift arachna state, byte-aware floor memory snapshots, Net Terminal Gen access, map-editor patches, trimmed world events, economy, banking, stock market, production, crafting materials/known recipes and valid containers. Runtime camera mode and interpolation state are transient and are reset on new run/load/restart; player angle and browser-local FOV settings remain the persistent facts. On load, packed visited-floor snapshots are restored before the active target floor is selected, so opened doors, edited cells, surfaces, containers and non-player/non-projectile entities survive a browser save/load cycle for remembered floors.

Only the current save shape version is accepted. Current-version sections are sanitized by their systems so malformed `localStorage` data cannot crash loading, but old or unversioned save shapes are rejected instead of migrated.

## Performance Rules

- No per-frame full-world scans.
- Dense per-cell state belongs in typed arrays.
- Rare data can use sparse maps.
- Use generation-time work, cooldowns, dirty flags, radius caps and ring buffers.
- Avoid hot-loop allocation and per-entity closures.
- Use toroidal helper methods for coordinates.
- Render reads resolved state such as `CameraView`; gameplay and camera-mode decisions stay in systems.

Current optimizations include baked whole-floor navigation, cached combat target scans, `dist2` range checks, entity id maps and bounded event/ring buffers.


## Systems

- **Damage Types:** 5 damage types (physical, energy, psi, acid, radiation).
- **Armor System:** light, medium, heavy, and faction-specific armor.
- **Crafting:** Unified `CraftRecipe` system.
- **Environment:** Wall/Object destruction, Barricades.
- **AI:** Squad macro-goals, Faction skirmishes, Smart inventory, Hide mechanics.
- **Arena:** Arena betting system.
- **Cinematics:** Cinematic cutscenes.
- **Mobile/Adaptive:** OOM fixes, Adaptive UI, Critter toggle.

## Content Extension Guide

### Add A Side Quest NPC

Create a module under the floor where the NPC lives, usually `src/gen/living/my_npc.ts` or a floor-specific folder.

Minimum pattern:

```ts
import { Faction, Occupation, QuestType } from '../../core/types';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';

const NPC_DEF: PlotNpcDef = {
  name: 'Новый NPC',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 80,
  maxHp: 80,
  money: 20,
  speed: 1,
  inventory: [{ defId: 'bread', count: 1 }],
  talkLines: ['До выполнения.'],
  talkLinesPost: ['После выполнения.'],
};

registerSideQuest('my_npc_id', NPC_DEF, [{
  id: 'my_quest_id',
  giverNpcId: 'my_npc_id',
  type: QuestType.FETCH,
  desc: 'Новый NPC: «Принеси две воды.»',
  targetItem: 'water',
  targetCount: 2,
  rewardItem: 'bandage',
  rewardCount: 1,
  relationDelta: 8,
  xpReward: 25,
  moneyReward: 10,
}]);
```

Then add a spawn function in the same module and hook it through the relevant floor manifest/spawner:

- `living/side_quests.ts` for random living side NPCs.
- `living/content_manifest.ts` for side-effect zone content modules.
- `<floor>/content_manifest.ts` for Ministry, Maintenance, Kvartiry, Hell, Void content.

### Add A Living Zone Content Module

Use `registerZoneContent()` from `src/gen/living/zone_content.ts`. The generator runs after the volatile maze and receives the target zone center.

Signature:

```ts
type ZoneContentGenerator = (
  world: World,
  nextRoomId: number,
  entities: Entity[],
  nextId: { v: number },
  zoneCx: number,
  zoneCy: number,
) => { nextRoomId: number };
```

Rules:

- Pick a stable zone HUD number.
- Bulldoze only non-`aptMask` cells.
- Stamp rooms with correct `RoomType`, `roomMap`, textures and features.
- Add doors to `world.doors` and `room.doors`.
- Protect permanent content with `aptMask`.
- Carve a corridor to existing floor cells.
- Spawn NPCs/items with `nextId.v++`.
- Register quests in the same module if needed.
- Import the module in `living/content_manifest.ts`.

Existing examples: `temple.ts`, `library.ts`, `market.ts`, `black_market_88.ts`, `mushroom_cellar.ts`, `obzh_school.ts`, `hospital_quarantine.ts`.

### Add Floor Content

Prefer one self-contained module with local constants, data registration, generator/spawner and optional debug hook.

Use manifests:

| Floor | Manifest |
| --- | --- |
| Living | `src/gen/living/content_manifest.ts` plus `side_quests.ts` |
| Ministry | `src/gen/ministry/content_manifest.ts` |
| Kvartiry | `src/gen/kvartiry/content_manifest.ts` |
| Maintenance | `src/gen/maintenance/content_manifest.ts` |
| Hell | `src/gen/hell/content_manifest.ts` |
| Void | `src/gen/void/content_manifest.ts` |

Only edit a floor orchestrator when adding a generic hook. Routine content should enter through the manifest.

### Add Items, Weapons, PSI Or Monsters

Items:

- Add `ItemDef` to `src/data/items.ts`.
- Give it a spawn room list, value, type and optional `use`.
- If it affects economy, map it in `src/data/resources.ts`.
- Item world/inventory visuals are normally derived from `defId` by `src/render/item_sprites.ts`; add generic visual tags/rules there instead of storing sprite ids in save payloads.

Weapons:

- Add item entry in `items.ts`.
- Add physical stats in `src/data/weapons.ts`, or PSI stats in `src/data/psi.ts`.
- Ensure ammo item exists if ranged.
- Add/confirm sprite id in `render/sprite_index.ts` / `render/sprites.ts` if needed.

Monsters:

- Add a file in `src/entities/`.
- Register in `src/entities/monster.ts`.
- Add ecology/counterplay in `src/data/monster_ecology.ts`.
- Add variants only if they change gameplay.
- Add rumors if the player needs a hint.

### Add A New Floor

This is integration work, not routine content.

Required:

1. Add enum only if a real generator exists.
2. Add generator under `src/gen/<floor>/`.
3. Register in `src/gen/floor_manifest.ts`.
4. Add transitions/lift/portal behavior.
5. Add save/load normalization if new state exists.
6. Add map/HUD names and debug visibility.
7. Add smoke or debug path.

Do not add a new `FloorLevel` for a catalog entry or numbered lift instance.

## Design Rules

- README documents shipped behavior. Design intent goes in `desdoc.md`.
- Every meaningful module should give the player a decision.
- New content must be reachable in game or through a clear debug path.
- Do not add frameworks, ECS libraries, physics engines or UI kits.
- Keep Russian player-facing text unless there is a specific reason.
- Use existing ids, registries and events before adding new global state.
- Publish meaningful facts through `systems/events.ts`.
- **Never use raw `Math.random()` in procedural generation or runtime simulation.** It breaks deterministic physics and unit tests. Always use `SeedRng`, `xorshift32`, or `seededRandom` from `src/core/rand.ts`.
- For systems/render/save/load/generation changes, run `npm run check` unless blocked; it writes `dist/`.
- For browser/render smoke coverage, run `npm run check:browser` or `npm run check:full`; both need Chrome or `CHROME_BIN`.
- For narrow data/content changes, run `npm run check:readonly` when possible, or at least `npm run typecheck`.
