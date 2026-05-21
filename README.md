# ГИГАХРУЩ

**ГИГАХРУЩ** - zero-runtime-dependency TypeScript/Vite browser game: procedural survival-horror life-sim / ARPG shooter inside a toroidal 1024x1024 concrete megastructure.

Procedural textures, procedural sprites, procedural sound, WebGL raycasting, canvas HUD, flat entity arrays, typed-array world storage. No runtime frameworks, no asset pipeline, one browser build.

Core engineering taste: no hardcoding, no crutches. Keep systems elegant, universal, minimal, modular, data-oriented and emergent.

This README is the factual implementation map. Design priorities for the next iteration are in [desdoc.md](desdoc.md). Engineering ownership and module rules are in [architecture.md](architecture.md).

## Save And Legacy Policy

The browser save lives in `localStorage` under `gigahrush_save` and carries the shape version from `src/systems/save_runtime.ts`. ГИГАХРУЩ is in active development: old saves and legacy runtime paths are not a product contract. When a gameplay/system update breaks save shape, bump the save shape version and reject stale saves explicitly instead of adding cross-version migration code.

Runtime sanitizers are still expected for the current save shape so corrupted local storage cannot crash loading. They are not a promise to load older development builds.

## Documentation Map

Active docs are intentionally narrow. Use them by role:

- `README.md`: shipped implementation facts only.
- `desdoc.md`: current planning snapshot and next-iteration priorities.
- `plans.md`: consolidated unimplemented/partial plans extracted from current planning docs.
- `architecture.md`: layer contracts, ownership rules and integration patterns.
- `alife.md`: shipped persistent procedural NPC population model.
- `scaling.md`: shipped high-density population, entity-index and smoke baseline facts.
- `cloudflare.md`: optional Cloudflare Net Sphere deployment notes.
- `commit.md`: release commit/deploy runbook for explicit commit requests.
- `LICENSE.md`: source-available non-commercial license for the game and repository.
- `Docs/DesignFloors/`, `Docs/ProceduralFloors/` and `Docs/Expansions/`: active design/reference packets.
- `scenarist.md`: active project-wide tone brief for player-facing text passes. It does not document shipped behavior.
- `Docs/ScenarioWriters/`: active subordinate voice/domain packets for text passes. It is active, not archive; read `Docs/ScenarioWriters/README.md` before using it.
- `monsters.md`, `expansion.md`, `anomalies.md` and `mobile.md`: stable compatibility entrypoints for older task references and broad planning packets.

Root `MACRO2_*.md` files were orchestration prompts, not documentation source of truth. They now live under `gatbage/MACRO2/` with the old parallel contract. Verify any archived prompt against the active docs and current `src/` before implementation.

Historical agent prompts, statuses, logs, batch files, retired root planning passes, root itch-page ZIP archives and scratch notes are consolidated into [appendix.md](appendix.md) or archived under `gatbage/` with paths preserved. `gatbage/**` is archive-only context unless a task explicitly asks for historical comparison. Do not recreate `Docs/Tasks`, `Docs/AgentLogs`, `Docs/AgentPrompts` or `Docs/DesignFloors/AgentPrompts` for routine work; append a compact note to `appendix.md` only when historical context genuinely needs to be kept.

## Build And Commands

```bash
npm install
npm run dev
npm run typecheck
npm run test:unit
npm run test:generation
npm run build
npm run build:size
npm run itch:build
npm run itch:verify
npm run artifacts:verify
npm run preview
npm run smoke
npm run content:audit
npm run check:readonly
npm run check:browser
npm run check:release
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
| `npm run check:readonly` | none | none | Safe preflight for agents: typecheck, unit tests and content audit. |
| `npm run build` | `dist/` | none | Production single-file browser build. |
| `npm run build:size` | `dist/build-size-report.json` | existing `dist/` | Warning-only size report for single-file HTML, gzip, generated frame data and source/render buckets. |
| `npm run check` | `dist/` | none | Default CI gate: readonly checks plus production build. |
| `npm run preview` | none | existing `dist/` | Serve the current production build locally. |
| `npm run smoke` | none in repo | Chrome or `CHROME_BIN`; existing `dist/` | Browser playability smoke through Vite preview and headless Chrome. |
| `npm run check:browser` | `dist/` | Chrome or `CHROME_BIN` | Self-contained browser gate: build, then smoke. |
| `npm run check:full` | `dist/` | Chrome or `CHROME_BIN` | Full validation: `check`, then smoke. |
| `npm run itch:build` | `dist/`, `itch/` | none | Rebuild, verify PWA shell files and emit itch.io HTML5 upload files. |
| `npm run itch:verify` | none | existing `dist/`, `itch/`, `itch_page_pack/` | Read-only itch.io upload pack verification. |
| `npm run artifacts:verify` | none | existing `dist/`, `itch/` | Read-only release artifact sanity check. |
| `npm run check:release` | `dist/`, `itch/` | existing `itch_page_pack/` | Release artifact gate: readonly checks, itch.io package build, artifact verification and itch pack verification. |
| `npm run cf:setup` | `wrangler.jsonc`; remote D1 | Cloudflare auth/Wrangler | Create/find D1, write binding, apply schema and migrations. |
| `npm run cf:schema` | remote D1 | Cloudflare auth/Wrangler | Reapply schema and guarded migrations to the configured D1 database. |
| `npm run cf:dev` | `dist/` | Cloudflare auth/config; Wrangler | Build, then run the Worker locally. |
| `npm run cf:deploy` | `dist/`; remote Worker | Cloudflare auth/config; Wrangler | Build, then deploy the Worker. |

`npm run itch:build` emits an itch.io HTML5 upload under `itch/`: `index.html` for direct single-file upload, `gigahrush-itch.zip` with `index.html` at the archive root, and upload notes for PWA manifest, icons and service worker metadata.

`npm run build:size` reads the latest `dist/index.html` and reports raw HTML size, gzip size, Bad Apple generated frame data, approximate sprite/texture source buckets, Rollup rendered module buckets from `dist/build-size-manifest.json`, and itch ZIP upload weight when a current `itch/gigahrush-itch.zip` exists. Current warning thresholds are 9.5 MB HTML, 4.5 MB HTML gzip, 4.5 MB itch ZIP, 5.8 MB Bad Apple frame source and 3.3 MB Bad Apple frame gzip. These are warning-only on the first pass: acceptable growth is small content growth that stays under the warning lines. If a release crosses one, do not remove content just to pass the report; record the reason in release notes and compress generated frames or sprite/texture code before adding more heavy data.

Cloudflare scripts are optional and only matter for Net Sphere deployment.

## Cloudflare Net Sphere

When deployed as a Cloudflare Worker with Assets and the D1 binding described in [cloudflare.md](cloudflare.md), the game exposes an optional in-game `НЕТ-СФЕРА` terminal on `N`. The title screen asks for a persistent `НЕТ-ИМЯ`; each browser also gets a persistent private `НЕТ-ГЕН` id in `localStorage` and a session id in `sessionStorage`. `/netgen NET-...` switches back to an existing cloud profile, `/new` creates a new `НЕТ-ГЕН`, and `/clear` clears local chat history. The terminal polls while open, sends a 30-second heartbeat, records active sessions, samosbor events, deaths, compact progress, recent dry event summaries such as `Жилец умер. Последний сигнал: Жилая зона, д2 08:30.`, and short sanitized chat messages labeled by nickname. The Worker also exposes an optional `/api/net/market` endpoint for compact global market impulses and bounded aggregate quote snapshots. If the binding is missing or the API is offline, the game continues as a local single-file build.

Direct HTTPS builds also expose PWA metadata. The mobile `FULL` control requests browser fullscreen only on compatible non-iOS browsers. Embedded mobile hosts show a direct-page launcher instead. iPhone/WebKit does not get the forced fullscreen path because it can reload the web view; iOS standalone Home Screen launch remains supported through the manifest and Apple web-app meta tags.

## Implementation Snapshot

Current shipped-data scale, counted from source registries:

| Domain | Current count |
| --- | ---: |
| Story `FloorLevel` values | 6 |
| Authored routed design floors | 18 |
| Seeded procedural interstitial floors per run | 61 |
| Procedural floor geometry / majority / anomaly profiles | 10 / 5 / 18 |
| Numbered lift anomalies | 8 |
| Main plot steps | 16 |
| Plot/side NPC ids after production manifests load | 313 |
| Side quest steps after production manifests load | 372 |
| System assignment templates | 201 |
| Item ids | 253 |
| Physical weapon stat entries | 32 |
| PSI weapon stat entries | 16 |
| Base monster kinds | 25 |
| Monster ecology entries | 25 |
| Monster modifier variants | 23 |
| Static rumors | 515 |
| Samosbor variants / modifiers / aftermath beats | 8 / 21 / 40 |
| Samosbor director beats | 34 |
| Economy resources | 17 |
| Caravan supply lanes / small caravan templates | 6 / 5 |
| Factory definitions / recipes | 12 / 19 |
| LIVING manifest entries | 31 |
| Manifest imports checked by content audit | 128 |
| Debug commands, including routed teleports | 99 |

`npm run content:audit` is intentionally conservative and reports static literal registrations: currently 303 plot NPC ids, 348 side quest steps and 133 literal contract entries. The runtime counts above include production manifest imports, dynamic route-floor side-quest registration and spread/composed contract arrays used by the running game.

## НЕТ-ТЕРМИНАЛ ГЕН

The current build includes an optional debug/diegetic current-floor map editor. Rare in-world `НЕТ-ТЕРМИНАЛЫ` can be used with `E`; without access they show `НЕТ-ТЕРМИНАЛ ГЕН НЕ ОБНАРУЖЕН`. A seed-fixed `Странный кусок плоти` appears once per run on one route floor, survives floor rebuild logic through run state, and unlocks terminal access when picked up. The debug menu can also grant access, place terminals, open the editor, replay the current floor patch, and clear the current patch.

The editor is a canvas HUD overlay over the live `World`: it can paint cells, doors, textures and features, spawn/delete entities and containers from live game registries, choose NPC faction variants, and replay compact current-floor patches after floor transitions, save/load and samosbor rebuilds.

`E` interaction now routes through a shared dispatcher used by desktop, HUD prompts and mobile context. Generated floors also seed sparse interactable registries for gambling machines, local computers and НЕТ-hack terminals; these open canvas overlays, publish world events and mutate only local player/runtime state.

`silicon_net_well` is a routed design floor at `z=18`: a кремниевый НЕТ-колодец with Sibo, administrators, a cyborg scientist, special НЕТ-КОЛОДЕЦ terminals, Safeguard hack backlash and the rare `gravity_beam_emitter`. Failed special-console hacks publish `net_terminal_hack_failed` and spawn one Safeguard subject to cooldown; the GBE is a generic energy weapon that deletes a bounded beam line of cells, doors, containers and entities.

## Concept

The game is a survival-horror life-sim and stalker-like expedition shooter in a giant self-rearranging Khrushchev block. The world is a 1024x1024 torus. Rooms, corridors, zones, lifts, factions, NPC schedules, containers, quests, production, rumors and samosbor events all exist in the same persistent gameplay loop.

The player starts on `FloorLevel.LIVING` in the act hall. Nearby are Olga, Barni's armory range, Yakov's lab, Vanka's den, a protected expedition prep point with a public loadout/checklist stash and the first living-zone POIs. From there the player makes expeditions: prepare food/water/ammo, take a quest or rumor, move through faction territory, fight or sneak, survive samosbor, loot containers, return with consequences.

Core loop:

1. Get a lead: plot quest, side quest, system assignment, rumor, faction event, production shortage.
2. Prepare: weapon, ammo, medicine, water, documents, PSI.
3. Travel: zone control, rooms, lifts, POIs, monsters, NPCs.
4. Decide: trade, steal, repair, escort, kill, hide, forge, expose, reroute, flee.
5. Survive samosbor and aftermath.
6. Bring back loot, XP, reputation, money, story progress or trouble.

## A-Life Population

New runs create a compact in-memory pool of `1_000_000` procedural NPC records when runtime memory allows it, falling back to `100_000` on constrained browsers. Records are distributed across story floors, routed design floors and the per-run procedural floor deck. Only the current floor is materialized into live `entities`; other floors keep identity, floor assignment, family id, quest affordance, RPG traits, loadout, death state and optional last known coordinates without running AI.

Persistent NPC generation uses data profiles in `src/data/alife_generation.ts`: faction weights, level tail, wealth tail, pockets and occupation mixes remain expandable without rewriting the runtime system.

When a floor is generated, ambient generator NPCs are used as placement templates and replaced by A-Life NPC entities with stable `alifeId` / `persistentNpcId`. Materialized NPCs also carry personal `playerRelation`, initialized from faction attitude plus deterministic individual fluctuation, and `karma` in `[-128, 128]`, with faction-biased distribution. Before floor transitions, samosbor rebuilds and saves, live A-Life NPC state is folded back into the pool. Killed A-Life NPCs and killed `plotNpcId` NPCs do not respawn on later visits. Saves store the A-Life seed, dead ids and changed-record overrides, not the full live entity array.

The player is an A-Life actor too: the player has `karma`, kill counters, rank score inputs and `playerRelation = 100` to self. The Faction/A-Life panel includes a cached `A-LIFE РЕЙТИНГ ТОП 100` with the player's own global rank among alive persistent NPCs.

Periodic background NPC/monster refill is disabled. NPC updates now come from current-floor AI, explicit faction/events/caravans, slow bounded migration/event passes, samosbor rebuild materialization and quest/scripted spawns. Monsters still appear through initial generation, samosbor, quests, lift encounters, hack backlash and authored consequences.

The detailed product and engineering contract for this system lives in [alife.md](alife.md).

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
    plot.ts         PLOT_NPCS, PLOT_CHAIN, side quest registry
    plot_rooms.ts   story room specs
    contracts.ts    system assignment templates
    resources.ts    economy resources
    caravans.ts     caravan lane definitions
    factories.ts    production definitions and recipes
    banking.ts      bank route definitions and credit/deposit data
    stock_market.ts global/local quote definitions
    permits.ts      access papers and permit spoilage rules
    computers.ts    generated local computer definitions
    gambling.ts     generated gambling machine definitions
    net_hack.ts     local hack terminal definitions
    emergency_panels.ts emergency panel definitions
    rumors.ts       static rumor definitions
    relations.ts    faction and occupation text/relations
    monster_*.ts    ecology, variants, slime/zhelemish data
    design_floors.ts authored string-id floor route stops
    procedural_floors.ts floor geometry/faction/anomaly combinatorics
    floor_*.ts      catalog and numbered lift instances
    samosbor_*.ts   samosbor variants and director beats
    void_protocols.ts
  entities/
    monster.ts      monster registry and variant application
    *.ts            25 monster definitions + sprite generators
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
    shared.ts
  systems/
    ai/            NPC/monster AI, combat, pathfinding, FSM
    alife.ts       persistent procedural NPC pool and floor materialization
    net_sphere.ts  optional Cloudflare identity, heartbeat, stats, chat and event client
    samosbor.ts    siren, fog, seals, rebuild, boss/monster spawns
    events.ts      structured world event buffers
    quests.ts      plot, side, procedural and contract quest handling
    inventory.ts   inventory, trade, item use, weapons
    factions.ts    zone capture, hostility, faction events
    economy.ts     resource stocks and scarcity prices
    banking.ts     deposits, loans, interest and route bank state
    stock_market.ts quote ticks and global market impulses
    caravans.ts    supply lane slow ticks and tariff state
    production.ts  factory ticks into containers
    containers.ts  world containers and theft/access rules
    interactions.ts shared E-interaction dispatcher
    computers.ts, gambling.ts, net_hack.ts generated local overlays
    emergency_panels.ts emergency panels and repair/report actions
    permits.ts     access checks, exposure and spoiled documents
    procedural_floors.ts per-run vertical route and floor specs
    floor_instances.ts numbered lift anomaly state
    route_cues.ts  bounded audio/HUD path hints from generated markers
    room_memory.ts local room facts from noise, violence and witnesses
    noise.ts       bounded sound records for doors, shots and footsteps
    rumor.ts       rumors from static data and events
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

| Enum | HUD name | Generator | Role | Transition |
| --- | --- | --- | --- | --- |
| `MINISTRY = 0` | Министерство | `src/gen/ministry/` | documents, permits, offices, archives | story anchor `z=-24` |
| `KVARTIRY = 1` | Квартиры | `src/gen/kvartiry/` | dense social riot floor | story anchor `z=-12` |
| `LIVING = 2` | Жилая зона | `src/gen/living/` | start, hub, apartments, POIs | start story anchor `z=0` |
| `MAINTENANCE = 3` | Коллекторы | `src/gen/maintenance/` | industrial tunnels, water, repairs | story anchor `z=20` |
| `HELL = 4` | Мясной низ | `src/gen/hell/` | high-threat meat/cult floor | story anchor `z=28` |
| `VOID = 5` | Пустота | `src/gen/void/` | final anomaly/boss floor | story anchor `z=36`, portal from Hell/Underhell |

Normal lifts move through a per-run vertical `FloorRun` route rather than directly through adjacent enum values. The player starts on `LIVING` at `z=0`. Authored/story route stops are spaced every four z-levels by default, and the three levels between each authored/story stop are seeded procedural floors unless an authored stop explicitly occupies a gap. `pioneer_camp` sits above Ministry after the upper office stop: `MINISTRY` at `z=-24`, `upper_bureau` at `z=-28`, `pioneer_camp` at `z=-32`. `bank_floor` occupies the Ministry-to-Raionsovet procedural gap at `z=-22`; `silicon_net_well` occupies the service-to-Maintenance gap at `z=18`. The current normal lift span is `z=-44..40` with 24 authored/story stops and 61 procedural floors:

```txt
z=-44 roof
z=-43..-41 procedural
z=-40 chthonic_attic
z=-39..-37 procedural
z=-36 antenna_court
z=-35..-33 procedural
z=-32 pioneer_camp
z=-31..-29 procedural
z=-28 upper_bureau
z=-27..-25 procedural
z=-24 MINISTRY
z=-23 procedural
z=-22 bank_floor
z=-21 procedural
z=-20 raionsovet_archive
z=-19..-17 procedural
z=-16 registry_morgue
z=-15..-13 procedural
z=-12 KVARTIRY
z=-11..-9 procedural
z= -8 manhattan_crossroads
z= -7..-5 procedural
z= -4 communal_ring
z= -3..-1 procedural
z=  0 LIVING
z=  1..  3 procedural
z=  4 floor_69
z=  5..  7 procedural
z=  8 black_market_88
z=  9.. 11 procedural
z= 12 production_belt
z= 13.. 15 procedural
z= 16 service_floor
z= 17 procedural
z= 18 silicon_net_well
z= 19 procedural
z= 20 MAINTENANCE
z= 21.. 23 procedural
z= 24 dark_metro
z= 25.. 27 procedural
z= 28 HELL
z= 29.. 31 procedural
z= 32 underhell
z= 33.. 35 procedural
z= 36 VOID
z= 37.. 39 procedural
z= 40 darkness
```

`VOID` is reachable by the normal route at `z=36` and by portal from Hell/Underhell. The return portal in `VOID` sends the player back to `LIVING` and the run continues in freeplay.

Route floors at `z>=36` are NPC-free endgame spaces: `VOID`, the deeper procedural floors and `darkness` still generate monsters, loot, protocols and hazards, but no NPCs or faction event spawns.

When switching floors, the floor is regenerated and the player preserves HP, needs, inventory, equipped weapon/tool, money and RPG stats.

### Authored Design Floors

These are routed string-id floors, not new `FloorLevel` enum values. Each one is generated by `src/gen/design_floors/<id>.ts`; runtime systems use its `baseFloor` for mood, economy, monsters and faction defaults.

`src/gen/design_floors/full_floor.ts` expands these authored modules into full 1024x1024 route floors with route-specific secondary layout algorithms, zone retuning, lights, doors and connectivity. The small authored rooms remain as named POIs inside the larger floor. `roof` also exposes a 1024x1024 dynamic sky provider backed by 16x16 cloud chunks; `render/webgl.ts` consumes it through a generic dynamic ceiling texture slot, and roof light comes from a uniform sky lightmap instead of placed lamps. `bank_floor` adds cash desks, a deposit row, credit window, debtor queue, staffed vault and a service bypass; banking choices currently use existing NPC quest and container systems with `banking` tags for deposits, loans, repayments, forged debt paper and vault theft. `floor_69` seeds an ambient adult population using the F69 procedural sprite bank, with female NPC variants forming a majority of that floor's added crowd. `silicon_net_well` is a Maintenance route floor for NЕТ access, silicon life and hackable NЕТ-колодец terminals. `dark_metro` has fixed-route moving trains: they stop at platforms, allow `E` boarding/exit, carry the player between stops and crush living entities on active rails.

| z | Route id | HUD name | Base floor |
| ---: | --- | --- | --- |
| -44 | `roof` | Крыша | `MINISTRY` |
| -40 | `chthonic_attic` | Чердак техслужб | `MINISTRY` |
| -36 | `antenna_court` | Антенный двор | `MINISTRY` |
| -32 | `pioneer_camp` | Пионерлагерь | `LIVING` |
| -28 | `upper_bureau` | Верхнее бюро | `MINISTRY` |
| -22 | `bank_floor` | Банковский этаж | `MINISTRY` |
| -20 | `raionsovet_archive` | Райсовет и архив картотек | `MINISTRY` |
| -16 | `registry_morgue` | Морг регистраций | `MINISTRY` |
| -8 | `manhattan_crossroads` | Перекрестки | `KVARTIRY` |
| -4 | `communal_ring` | Коммунальное кольцо | `KVARTIRY` |
| 4 | `floor_69` | Этаж 69 | `MAINTENANCE` |
| 8 | `black_market_88` | Черный рынок 88 | `LIVING` |
| 12 | `production_belt` | Производственный пояс | `MAINTENANCE` |
| 16 | `service_floor` | Служебный этаж | `MAINTENANCE` |
| 18 | `silicon_net_well` | Кремниевый НЕТ-колодец | `MAINTENANCE` |
| 24 | `dark_metro` | Темная пересадка | `MAINTENANCE` |
| 32 | `underhell` | Нижний пропускник | `HELL` |
| 40 | `darkness` | Темный отсек | `VOID` |

### Procedural Floor Combinatorics

`src/data/procedural_floors.ts` defines the data deck for random interstitial floors:

- geometry type: `living_blocks`, `apartment_pressure`, `communal_knots`, `attic_weatherworks`, `archive_warrens`, `collectors`, `workshops`, `service_spines`, `sump_causeways`, `admin_pockets`;
- main faction: citizens, liquidators, cultists, wild or scientists, with citizens weighted highest and cultists lowest;
- anomaly: none, teleport cells, smog, samosbor seed, mushroom mycelium, Hladon cold pocket, false safe block, mirror run, radio chess, conveyor sorter, fractal floor, cement memory, wall snake, rail trains, Bad Apple world, zombie apocalypse, section shift and Conway life;
- danger level: `1..5`, derived from vertical depth, direction and random seed;
- per-floor loot and monster bias ids derived from the same seed.

`src/systems/procedural_floors.ts` owns save/load state for the run seed, current `z`, visited procedural specs, authored route entry resolution and lift route resolution. `src/gen/procedural_floor.ts` builds procedural floors without spawning authored story NPCs: rooms/corridors, both lift directions, zone danger, faction majority, seed-biased loot, seed-biased monsters and anomaly effects.

Teleport-cell anomaly pairs are stored sparsely in `world.anomalyTeleports`. Stepping on one paired cell moves the player to the paired cell after a short cooldown. Mushroom-mycelium floors also seed bounded carnivorous fungus rooms with corpse/bait feeding, salt neutralization, fire burn-off and risky zhelemish harvests. False safe blocks stamp quiet corridors, a too-clean shelter, black-hand marks, a missing-siren panel and cult-owned supplies; investigating, reporting, looting or breaking the marker publish events, while samosbor pressure is only partially delayed. Hladon cold pockets are bounded procedural rooms with pale frost marks; they slow and drain needs only inside/near the marked cells, and heat items, valve/steam tools or alternate routing counter them. Rail-train anomalies cut fixed rail routes through the floor, add platforms with schedule screens, spawn moving train segments, allow `E` boarding/exit while stopped and publish rail events when trains crush NPCs, monsters or the player. Bad Apple world stamps a 144x108 map rectangle from packed black/white RLE frames; black pixels become dark walls, white pixels become pale floor, and the projector can be paused/resumed with `E`. Zombie apocalypse floors seed up to the shared 5k active resident NPC ceiling plus patient zero, and any NPC bitten by a zombie becomes another zombie.

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

The player spawns in the **Актовый зал** on `LIVING`. It is a protected room with desks, slides and Olga Dmitrievna. The neighboring **Оружейная** is Barni's firing range: metal walls, targets (`Tex.TARGET`) and 9mm ammo on the floor.

Yakov Davidovich's lab is generated farther from spawn as a separate content module. Vanka's den is another story POI. The path to them is real gameplay, not just tutorial text.

The act hall and adjacent protected rooms use `aptMask`, so the living-floor volatile rebuild does not erase them during samosbor.

Slide textures rotate through 8 frames / 4 pairs:

1. Welcome and block number.
2. Collective labor slogan.
3. Samosbor/hermodoor instructions.
4. Purple fog warning.

## Story Chain

The main plot is data-driven through `PLOT_NPCS` and `PLOT_CHAIN` in `src/data/plot.ts`. Story rooms live in `src/data/plot_rooms.ts` and floor generators under `src/gen/*/`.

| # | Giver | Type | Objective | Main reward |
| --- | --- | --- | --- | --- |
| 1 | Ольга Дмитриевна | TALK | talk to Barni in the armory | Makarov + 9mm |
| 2 | Барни | TALK | report back to Olga | bandages, water, bread |
| 3 | Ольга Дмитриевна | TALK | visit Yakov Davidovich | `psi_strike` |
| 4 | Яков Давидович | FETCH | bring an idol of Chernobog | `psi_mark`, medicine, money |
| 5 | Яков Давидович | TALK | find Vanka Banchiny / Ivan Zakharov | antidepressant |
| 6 | Ванька Банчиный | KILL | kill a Shadow | `psi_recall` |
| 7 | Ванька Банчиный | FETCH | bring strange clot to Yakov | medicine |
| 8 | Яков Давидович | TALK | go to Major Grom in Maintenance | `psi_rupture`, money |
| 9 | Майор Громный | KILL | kill 10 monsters near the outpost | AK-47, 7.62 ammo |
| 10 | Майор Громный | KILL | destroy Mancobus | `psi_storm`, ammo, money |
| 11 | Майор Громный | VISIT | enter Hell | bandages, antidepressants |
| 12 | Никанор Обожжённый | TALK | find Marfa at the Herald threshold | `psi_phase`, holy water |
| 13 | Марфа Пороговая | KILL | kill three Heralds | `psi_void_needle` |
| 14 | Жан Пустотник | FETCH | bring the bottled voice | PSI stabilizer |
| 15 | Жан Пустотник | KILL | kill the Creator | void spike |
| 16 | Жан Пустотник | FETCH | leave the void spike before return | holy water, medicine |

Quest markers appear on minimap/full map. TALK points to target NPC, VISIT to room/floor target, FETCH generally back to the giver unless the quest has a specific target.

Procedural NPC assignments have deadlines instead of a global active-quest cap. The shortest rare urgent tasks, such as a nearby danger cleanup during samosbor, get at least 1 in-game hour. Normal procedural work is usually around a day. Cross-floor, high-rank, multi-kill or high-count assignments can run for several days. Plot-chain quests and most hand-authored side quests registered through content modules do not expire unless a module explicitly sets a deadline.

## Side Quests And System Assignments

Side quests use `registerSideQuest()` from `src/data/plot.ts`. Content modules register NPC definitions and quest steps at module import time. With production floor and design-floor manifests loaded, the current runtime registry has 313 plot NPC ids: 9 built-in story NPC ids plus 304 content registrations. `SIDE_QUESTS` has 372 steps across base data and `src/gen/`.

Major side-content locations include:

- `living/`: temple, Istotit supply cache, library, market, black market 88, mushroom cellar, zhelemish cellar, zhelemishnik, carnivorous fungus room, fake zhelemish medpost, concierge/radio/kitchen pack, domkom/laundry pack, domkom ammo locker, emergency medpost, expedition prep, external-cell neighbor, govnyak smoke den, cartographer room, hermoseam station, school ОБЖ, hospital quarantine, white compulsion room, Belaya Prislushka, Veretar window room, scientist escort sample, Golos za dveryu, Plombirovshchik, Samosbornyy Ostov and art studies.
- `ministry/`: permit office, weapon permit bureau, document gate, stamp room, interrogation room, queue hall, inspection archive, raionsovet archive, liquidator archive, NII contraband audit, Chernobog docket handlers, refusal clause, secret smoking room, Kartotechnik archive, Matka Dokumentov room, routed ministry design-floor content and named NPC pack.
- `kvartiry/`: ration queue, Ocherednik, water riot, ammo smelter, illegal print room, barricade, false neighbor, Pustoy Sosed, communal kitchen feud, cult supply kitchen, Chernobozhiy Svod, lost child corner, medicine swap, red corner, KV08 route assembly and named social NPCs.
- `maintenance/`: forpost, Mancobus room, flooded lab, pressure station, steam valves, diver cache, water bridge, Paritel steam bridge, watermeter post, overflow sluice, heatline zero, metro error line, concentrate press, Pressovik, Nasosnaya Matka, lift repair shaft, Remontnik bez smeny, charge cage 089, automation cage, Hladonets, Kabelnik, collectors pressure reroute, defector liquidator, Ostavshiysya Likvidator, NII slime sample post, blue glow sample, green acid room, brown slime cleanup room, slime deactivation furnace, slime singing vents, Ventshun, red adhesive trap, cult-held workshop, Seroburmaline no-look route, pneumomail station, black slime eyes, Chernaya Lichinka, Betonoed shortcut, Kostorez locker and Filtronos.
- `hell/`: Nikanor/Marfa plot rooms, Meduka, altar arena, choir tax, PSI meat cache, thin wall chapel and Myasomer.
- `void/`: Jean's warning cell, bottled voice, protocol chamber, borrowed light rule chamber, trace seal protocol, Maronary Signalshchik, Pristav Pustoty, Perestanovshchik, Seryy Smotritel and Ekrannik.

System assignment templates live in `src/data/contracts.ts`; quest generation treats them as normal system-assignment templates with scarcity-adjusted rewards and deadlines. The current deck has 201 templates, including expedition, small-caravan escort/raid/reroute work, scarcity, monster cleanup, civil-minister directives, Ministry document-window work, minor-cult errands, govnyak courier and pneumomail-linked work. Debug can create/list system assignments, but the player-facing NPC action remains `Задание`.

On `KVARTIRY`, the false-neighbor/Pustoy Sosed content uses a screen-reflection tell and local side-quest branches: expose by checking papers/reporting to liquidators, flee by taking the complaint and leaving, or force a close reveal and fight. Resolved branches publish `false_neighbor` world-event data and rumor hooks.

## World And Data Model

- The world is a 1024x1024 torus.
- Dense per-cell state is typed arrays on `World`: cells, wall/floor textures, features, light, fog, room map, zone map, masks and marks.
- Sparse per-cell data is reserved for rare state: doors, containers, surface marks, decals and anomaly teleport links.
- Entities are flat plain objects in one array. There are no entity subclasses.
- Entity population soft limits live in `src/data/entity_limits.ts`: 5k NPCs, 10k monsters and 100k item drops. Generation, quest/event, editor and debug spawns use `src/systems/entity_limits.ts` before adding more.
- Floor-wide population/content placement goes through `src/gen/population_placement.ts`: generation builds a dense 1024x1024 placement field from room weights, zone weights, optional anchors and value noise, smooths it locally over neighboring floor cells, then samples the field with coverage strata. This is generation-time scattering, not a runtime bucket cap. Current high-density NPC/monster paths for Kvartiry, Hell and procedural floors use this field approach.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2` for all toroidal coordinate work.
- Prefer `dist2` when only comparing range.

Cell types: `FLOOR`, `WALL`, `DOOR`, `ABYSS`, `LIFT`, `WATER`.

Features include lamps, tables, chairs, beds, stove, sink, toilet, shelves, machines, apparatus, lift buttons, desks, slides, candles and screens.

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

During living-floor samosbor rebuild, `wipeVolatile()` + `generateVolatileMaze()` replaces the volatile maze. Apartments and protected content survive.

### Ministry

`generateMinistry()` builds a grand administrative labyrinth: axial public halls, nested rings, queue switchbacks, archive/service backroutes, locked authority shortcuts, marble courtyards, DFS corridor filler, offices, archives, red carpets, marble walls, parquet, portraits, procedural screens and administrative content manifest.

Ministry content is grouped behind `src/gen/ministry/content_manifest.ts` to keep the generator stable.

### Kvartiry

`generateKvartiry()` creates a dense residential riot floor from a wall-source grid and keeps that percolation layout intact. Initial population comes from `KVARTIRY_POPULATION_PROFILE`: 3000 citizens, 1700 wild residents and 400 liquidators, all with AI inside the shared 5k NPC ceiling. Spawn placement is context-weighted: rooms, public corridors, zone factions and smooth density noise bias independent floor-cell picks across the whole floor. Runtime population refill is disabled; social-pressure POIs and ambient unrest can trigger local uprising checks on the existing profile cadence.

### Communal Ring

`generateCommunalRingDesignFloor()` is the authored route-floor коммуналка at `z=-4`: a ring corridor with four сквозные communal flat chains, shared kitchen/laundry/shower/pantry/notice services, wet samosbor aftermath, owned/public containers, 6 quest NPCs and 6 side quests. The full-floor expander keeps the route footprint wide with additional shared-service knots around the 1024x1024 floor.

### Maintenance

`generateMaintenance()` creates DFS-like tube tunnels on a coarse grid, pipe walls, junction rooms, water and industrial spaces, then applies collector macro geometry. Additive content is grouped in `src/gen/maintenance/content_manifest.ts`. Charge cage 089 is a utility-room production POI whose energy-cell output lands in an owned container.

Heatline Zero is a static pressure POI: using the vent machinery on Maintenance can repair the line with asbestos cord, sealant and a manometer, force a risky shortcut with partial parts, or vent steam and fog on failure.

The pneumomail station is a static Maintenance POI with intake, intercept, jam and report panels. It emits bounded capsules that create true leads, false leads, warnings, contraband and one static system assignment through existing rumor, contract and event systems.

### Hell

`generateHell()` builds organic meat caves through an Ising-style field plus Hell macro geometry, Hell-tuned zones, cultists, liquidators, monsters, 3 Heralds, Hell plot rooms and faster population pressure. Initial counts come from `HELL_POPULATION_PROFILE`: 4200 monsters, 700 cultists and 100 liquidators, all with AI. Spawn placement uses the shared smoothed whole-floor placement field with zone/noise weights; route arenas remain anchors, but initial population is not piled into arena cells. Runtime population refill is disabled; additional pressure comes from samosbor, quests, lift encounters, hack backlash and authored consequences.

### Void

`generateVoid()` builds folded green/black island geometry, void zones, Jean's warning cell without an NPC, protocol rooms, about 1600 active guardians, loot and the Creator boss. The route-facing `generateFloor(FloorLevel.VOID)` path strips NPCs, so the default endgame space stays NPC-free while still running monsters/protocols. It is reachable on the normal `FloorRun` route at `z=36`, by debug teleport, and by the Hell/Underhell portal after the Herald path opens.

### Procedural Floors

`generateProceduralFloor(spec)` is the generic interstitial generator. It consumes one `ProceduralFloorSpec` from the run deck and creates a non-story floor from plain data:

1. Stamp a room graph from the chosen geometry profile.
2. Connect rooms with toroidal corridors and ensure connectivity.
3. Generate 64 zones, danger levels and main faction control.
4. Place up/down lifts.
5. Spawn NPCs from the main faction mix through the shared smoothed whole-floor placement field, except on NPC-free endgame route floors at `z>=36`.
6. Spawn loot and monsters with seed-biased weights.
7. Apply the anomaly: fog, teleport pairs, samosbor-tainted zones/marks, mushroom growth with carnivorous fungus rooms, cold pockets, false safe blocks or zombie-apocalypse crowd/infection.

Geometry and anomaly authoring contracts for future agents live in `Docs/ProceduralFloors/geometry.md` and `Docs/ProceduralFloors/anomaly.md`.

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
6. A zone is captured by samosbor fog.
7. Fog boss and corridor/map monsters spawn.
8. Near the end, hermodoor sealing occurs with variant timing.
9. Fog spreads and can spawn monsters during active phase.
10. On the story `LIVING` floor, small/medium scale rolls start `systems/samosbor_wave.ts`: a bounded frontier mutates volatile cells during the active phase, preserving apartments, hermowalls, lifts and the player's shelter.
11. Full scale, route/design/procedural floors and wave start failures keep the old deferred `pendingLoad` rebuild path.
12. After end, doors reopen, aftermath may apply, and either the local wave is finalized or relevant floor geometry is rebuilt.

`data/samosbor_variants.ts` currently has 8 variants, 21 modifiers and 40 aftermath beats. Rare replacement variants include Maronary with green fog/high beep/wrong-door residue, Istotit with a bell cue, golden fog, marked shelter rooms and social aftermath, and Veretar with white-area leakage. `data/samosbor_director.ts` currently registers 34 bounded director beats for warnings, patrols, shortages, door malfunctions, aftershocks and rumor seeds.

Timers by story floor come from `src/gen/floor_manifest.ts`: Ministry is slowest, Kvartiry/Living/Maintenance are progressively more pressured, Hell and Void are fastest. Procedural floors additionally shorten the timer by danger level and anomaly pressure.

Route cues live on the concrete `World` that registered them. Story, design, procedural and floor-instance loads keep their generated cue state with that world object. Samosbor rebuilds are in-place, so full story/design/procedural replacements copy only the replacement world's fresh markers into the live world and drop old heard/followed/map-reveal state; Living's volatile regrow clears old cue state before the maze is regenerated. Runtime samosbor waves prune only cues whose source/target cells were touched by the wave.

## Events, Memory And Rumors

`systems/events.ts` stores structured `WorldEvent` facts in fixed ring buffers:

- recent events: 512
- important events: 128
- per-zone events: 32 x 64 zones

Events cover samosbor, zone capture, fog bosses, floor transitions, elevator anomalies, lift arachna, item pickup/drop/use/sale/handoff/destruction, tool breakage, ammo consumption, UV spotlight use, monster bait, quest/system-assignment creation/completion/failure, theft, containers, production, pneumomail capsules, ration coupon audits, shelter tallies, smog, route cues, faction events, monster windups/counterplay and kills.

`systems/world_log.ts` turns important public facts into HUD/log messages. `systems/npc_memory.ts`, `systems/context.ts` and `systems/rumor.ts` let NPC dialogue and rumor spreading react to those facts.

`data/rumors.ts` contains 515 static rumor definitions, and runtime events can become observed/spread rumors.

## NPC, A-Life And Factions

NPCs use `AIState` plus `NpcState`:

| State | Use |
| --- | --- |
| `SLEEPING` | night sleep in living room |
| `MORNING` | bathroom/kitchen/corridors |
| `WORKING` | job room by occupation |
| `LUNCH` | kitchen/common food behavior |
| `FREE_TIME` | smoking, kitchen, wandering |
| `HIDING` | samosbor shelter |
| `TRAVELING` | wanderers/pilgrims/hunters |
| `MEETING` | Ministry/common room behavior |
| `PATROL` | liquidator/faction patrol |
| `BREAK` | smoking/break behavior |

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

The world has 64 macro-zones. `systems/factions.ts` controls zone ownership, patrol/noise response, territory capture and hostile target logic. `data/faction_events.ts` adds discrete faction events. Cult processions are rare timed faction events with capped pilgrims, residue marks, temporary local control pressure, map/log warnings, and player responses: avoid, follow, report by equipped radio, use a meat rune as disguise, or disrupt by violence. Active processions publish aftermath and end when a samosbor cycle starts.

Personal NPC relation to the player is separate from faction relation but uses the same hostile threshold. Attacking an NPC lowers that individual relation, and quest completion raises the giver's personal value more than the issuing faction's small normal gain (`+1`). An individual NPC can therefore become hostile or grateful even before the faction-wide matrix fully changes. Player karma starts at `0`; attacking non-enemies, stealing and urinating on owned floor reduce it.

NPC and monster broadphase uses `systems/entity_index.ts`: a 16-cell toroidal bucket index with live id, actor, needs and projectile lists. Combat scans are cached through `combatTargetId` / `combatScanCd` and query nearby buckets instead of scanning every entity. All live AI actors remain active; far routine actors tick on deterministic accumulated cadences, while near-player actors and player-targeting threats stay responsive. NPCs are primed with an A-Life state/task before LOD cadence can skip them, moving monsters default to wandering, and actors with a combat target use `HUNT`. Pathfinding uses `systems/ai/pathfinding.ts`: a baked whole-floor BFS navigation tree over the 1024x1024 toroidal field, rebuilt when `world.cellVersion` or samosbor phase changes. Routine and combat path assignment read bounded chunks from that tree instead of launching per-actor BFS queues; ordinary closed doors are routeable and opened by movement, while locked and hermetic-closed doors block navigation. Shared A-Life destinations, such as nearest kitchen, toilet, workplace or shelter class, use cached behavior flow fields layered over the same geometry: each behavior supplies a source set, the field is baked once per geometry version, and many actors follow bounded chunks from it. The AI LOD profile also caps far hot-promotions for active attackers, projectile owners and recently damaged actors, so large NPC/monster fights continue on combat cadence without making every distant participant frame-rate hot.

## Items, Weapons And PSI

`src/data/items.ts` currently defines 253 item ids:

- food and drinks: bread, canned food, kasha, briquettes, water, tea, kompot, coffee, etc.
- medicine: bandage, pills, antidepressant, antibiotic, morphine, PSI stabilizer, sanitary kit.
- weapons as items: knives, pipes, pistols, shotguns, rifles, tools, energy weapons, PSI clots.
- ammo: 9mm, shells, nails, 7.62, belt, energy cells, fuel, special ammo.
- tools: flashlight, repair kits, cleaning kit, vacuum, radio, fog detector, unpeople detector.
- documents and components: permits, forms, denunciations, seals, tickets, manometer, filters, wire, metal, electronics.
- plot and rare items: idol, strange clot, bottled voice, void spike, Maronary shaving, Veretar sand, overexposed photo and govnyak contraband.

Physical weapon stats live in `src/data/weapons.ts` and include 32 entries, including fists, melee tools, Soviet firearms, improvised firearms, energy weapons, grenade, flamethrower, harpoon gun and the deletion-beam emitter. PSI weapon stats live in `src/data/psi.ts` and include 16 entries.

PSI does not regenerate passively. It is restored by medicine/items and scales with INT through RPG stats.

## Monsters

25 base monster kinds are registered in `src/entities/monster.ts`:

`SBORKA`, `TVAR`, `POLZUN`, `BETONNIK`, `ZOMBIE`, `EYE`, `NIGHTMARE`, `SHADOW`, `REBAR`, `MATKA`, `IDOL`, `MANCOBUS`, `HERALD`, `CREATOR`, `SPIRIT`, `ROBOT`, `SHOVNIK`, `LAMPOVY`, `PECHATEED`, `TUBE_EEL`, `PARAGRAPH`, `NELYUD`, `KRYSNOZHKA`, `KOSTOREZ`, `SAFEGUARD`.

Monster supporting data:

- `src/data/monster_ecology.ts`: floors, rooms, counterplay, loot hints, rumor ids.
- `src/data/monster_variants.ts`: 23 cheap modifier variants, e.g. cracked, wet, silent, panel, office, deep, lamp, pipe, false, garbage, black-slime and betonoed.
- `src/systems/ai/monster.ts`: behavior rules.
- `src/entities/*.ts`: stats and procedural sprites.

Fog bosses can clear fog when killed. Matka is a spawner boss. Heralds open the path to Void. Creator is the final boss.

Krysnozhka, Sborka, Tvar, Polzun and Tube Eel can be distracted by explicit bait: dropped food or used/dropped govnyak creates a temporary capped marker. Bait attraction uses active marker caps and cooldowns, not item-drop scans. Tube Eel route set pieces combine water cells, dry-edge counterplay, harpoon ammo and non-cleanable wet-route HUD warnings instead of fluid simulation.

Kostorez is a rare Maintenance/Hell melee elite with a visible blade windup. Distance, a corner/obstacle, or shotgun pellets interrupt the burst; a carried `metal_sheet` can absorb part of one cut. Safeguard is a fast NET/BLAME blade guard used by `silicon_net_well` terminals and late-route NET backlash.

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

XP uses a soft quadratic formula in `systems/rpg.ts`. Monsters and NPCs can scale by zone level.

Needs:

- food
- water
- sleep
- pee
- poo

The player manages needs manually through items and behavior. NPC needs are restored by being in suitable rooms.

## Economy, Containers And Production

Economy:

- `src/data/resources.ts`: 17 resources.
- `src/systems/economy.ts`: per-floor stock, scarcity multiplier, adjusted price cache.
- `src/data/banking.ts` and `src/systems/banking.ts`: bank deposits, credit, repayment and interest state.
- `src/data/stock_market.ts` and `src/systems/stock_market.ts`: local quote ticks and optional Net Sphere market impulses.
- `src/data/caravans.ts` and `src/systems/caravans.ts`: 6 supply lanes, bounded slow ticks, tariff pressure and route actions.
- Scarcity affects item prices and some contract rewards.
- Money is currently carried as entity cash (`Entity.money`) and used by NPC trade.
- NPC trade moves one stack unit at the current scarcity-adjusted item price, transfers cash between buyer/seller and publishes trade or item-sale events.
- Current-version economy save data is sanitized on load, including missing floor/resource rows inside the accepted save shape.
- The debug menu has an economy prices summary for current stock and adjusted prices.

Containers:

- `src/data/container_defs.ts`: container generation definitions.
- `src/systems/containers.ts`: access rules, ownership, faction containers, locked/secret containers, theft events.
- `src/render/container_ui.ts`: two-inventory container UI.

Production:

- `src/data/factories.ts`: 12 production definitions and 19 recipes.
- `src/systems/production.ts`: up to 64 production rooms per floor, outputs deposited into room containers.
- Production publishes `room_produced_items`, `room_lacked_resources` and `room_blocked_production`.

## Rendering And UI

Rendering:

- WebGL DDA raycaster.
- Procedural texture atlas.
- Procedural sprite atlas for fixed props/projectiles plus seed-generated per-entity NPC/monster sprite textures.
- Per-cell wall/floor textures.
- Surface marks and blood/gore marks.
- Fog, glitch and HUD effects.
- Canvas overlays for all UI.

HUD/UI modules:

- `hud.ts`: main HUD and panels.
- `map_ui.ts`: minimap/full map.
- `quest_ui.ts`: quest log.
- `log_ui.ts`: message log.
- `npc_ui.ts`: NPC interaction menu.
- `container_ui.ts`: container transfer UI.
- `factions_ui.ts`: factions panel.
- `stats_ui.ts`: RPG/stat view.
- `menu_ui.ts`: save/load menu.
- `net_sphere_ui.ts`: optional Cloudflare stats/chat terminal.
- `computer_ui.ts`, `gambling_ui.ts`, `net_hack_ui.ts`, `emergency_panel_ui.ts`, `controls_ui.ts`: generated local interaction and controls overlays.

Screens show active floor/zone context, quest markers, fog overlay, NPC/monster/drop pips and current player status.

## Controls

`Tab` opens the in-game hotkey screen. It lists every registered keyboard action and lets the player rebind the selected action immediately; bindings are stored in browser `localStorage` separately from the game save. The game uses `KeyboardEvent.code`, so defaults follow physical keys and keep working across keyboard layouts; the browser Tab focus action is prevented while the game input handler is active.

| Key | Action |
| --- | --- |
| `WASD` | movement |
| Mouse | look / pointer lock |
| `E` | interact, door, NPC, container, menu confirm |
| `Space` / LMB | attack / shoot |
| `I` | inventory |
| `1` / `2` / `3` | spend STR / AGI / INT point in inventory |
| Arrow keys / `W` / `S` / `A` in menus | menu navigation; right movement uses `ArrowRight` |
| `M` | minimap -> full map -> off |
| `Q` | quest log |
| `L` | message log |
| `F` | factions |
| `N` | Net Sphere terminal; shows offline state when Cloudflare API is unavailable |
| `Tab` | hotkey/rebind screen |
| `Backspace` on hotkey screen | reset selected binding |
| `G` / `R` | use equipped tool; `R` also restarts from game-over prompt |
| `D` in inventory | drop selected inventory item |
| `P` | pee |
| `Z` | sleep when allowed |
| `Enter` | save/load menu or close menu |
| `~` | debug menu |

On touch devices the game shows a landscape mobile overlay: left virtual joystick for movement, right virtual joystick for camera rotation, center tap zone for attack/shoot, left `[E]` popup for nearby interaction targets, a top-left `FULL`/direct-page control when the browser can use it safely, and a right-side menu rail. The rail's up/down buttons choose inventory, map, quests, log, factions, Net Sphere, save/load menu or debug menu; the center button opens the selected panel or closes the current panel. The canvas resizes to the host viewport/fullscreen iframe, including itch.io mobile launch/fullscreen resizing. Canvas UI panels accept taps for selection, transfer, buy/sell, use/drop and close actions.

Debug menu currently has 81 base commands plus 18 routed design-floor teleports: weapons/PSI, spawn monsters/NPC/items, XP, samosbor variant cycle and small wave trigger, noclip, event log, economy prices, containers, production tick, system assignments, balance/catalog, lift instances, VOID protocols, faction events, route cues, samosbor director controls, story/design/procedural/anomaly teleports, Maronary/Istotit/Veretar forcing, govnyak courier, pneumomail, hermodoor borer QA, liquidator-cult clash, `ONEPUNCHMAN`, Net Terminal Gen/map editor commands, rail-train anomaly teleport, Bad Apple screen spawn near the player, zombie-apocalypse anomaly teleport, smoke expedition setup, expedition proof commands, permit debug commands and verification commands for contracts, events, lift route windows, numbered lift loops, samosbor warning, economy scarcity, floor monster packs and container routing.

## Save And Load

Save/load goes through browser `localStorage`. Saves include player state, game clock, quests, current base floor, `FloorRun` state, numbered lift anomaly state, lift arachna state, Net Terminal Gen access, map-editor patches, trimmed world events, economy, banking, stock market, production and valid containers. On load the target story/design/procedural/floor-instance world is regenerated, then player state and supported runtime state are restored.

Only the current save shape version is accepted. Current-version sections are sanitized by their systems so malformed `localStorage` data cannot crash loading, but old or unversioned save shapes are rejected instead of migrated.

## Performance Rules

- No per-frame full-world scans.
- Dense per-cell state belongs in typed arrays.
- Rare data can use sparse maps.
- Use generation-time work, cooldowns, dirty flags, radius caps and ring buffers.
- Avoid hot-loop allocation and per-entity closures.
- Use toroidal helper methods for coordinates.
- Render reads state; gameplay decisions stay in systems.

Current optimizations include baked whole-floor navigation, cached combat target scans, `dist2` range checks, entity id maps and bounded event/ring buffers.

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
- For systems/render/save/load/generation changes, run `npm run check` unless blocked; it writes `dist/`.
- For browser/render smoke coverage, run `npm run check:browser` or `npm run check:full`; both need Chrome or `CHROME_BIN`.
- For narrow data/content changes, run `npm run check:readonly` when possible, or at least `npm run typecheck`.
