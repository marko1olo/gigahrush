# Geometry Program For 2D Floor Generation

Status: research and planning document, 2026-05-29. No implementation is implied by this file.

Scope: improve existing floor geometry and propose new route/procedural floor families for GIGAHRUSH. This document is intentionally mathematical and algorithmic, but every idea must still compile down to the current repo contract: one 1024x1024 toroidal `World`, no new `FloorLevel` for route stops, no runtime dependencies, no renderer-owned gameplay state, no per-frame full-world scans.

Six-agent research synthesis:

- Turing: shipped-floor coverage audit across story anchors, authored route floors, procedural geometry ids, majority factions and anomaly overlays.
- Meitner: maze/labyrinth algorithm family beyond one Wilson pass: DFS, Prim, Kruskal, Eller, Growing Tree, Hunt-and-Kill, recursive division, unicursal labyrinths, locks, landmarks and pseudo-weaves.
- Helmholtz: 2D mathematical structure catalog: tilings, Voronoi/power diagrams, Reeb graphs, Laplacian fields, percolation, Potts/Ising, cellular automata, graph products, modular lattices and spectral layouts.
- James: authored route-floor upgrade matrix for all implemented `src/data/design_floors.ts` ids.
- Pasteur: generator integration, proxy-grid, cache/dirty flag, save-shape and validation cautions grounded in the current route/procedural pipeline.
- Hubble: missing expedition-facing floor families, including a true labyrinth and other strong route concepts that fit the game fantasy.

All six passes were read-only. This document is the only intended artifact.

## Repository Constraints

The generator is already a real game system, not a blank sandbox.

- The world is a 1024x1024 torus. All geometry and scoring must use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2`.
- Story/base floors are the six existing `FloorLevel` values. New route stops are string ids in `src/data/design_floors.ts` or procedural specs in `src/data/procedural_floors.ts`.
- `core/` owns primitive shapes, `data/` owns definitions, `gen/` owns construction, `systems/` owns runtime behavior, `render/` reads and draws.
- Geometry must create real `Room` records, coherent `roomMap`, doors, textures, features, lifts and reachable playable space.
- Generation-time heavy math is acceptable when bounded. Runtime heavy math must be sparse, cached, radius-bounded, cadence-bounded or avoided.
- A-Life population is not a geometry system. Geometry may provide placement fields, templates and anchors; it must not create silent background refill.
- Samosbor may mutate geometry, but protected apartments, hermetic shelter walls, lift access and route-critical anchors need explicit protection/repair.
- Existing docs already have procedural contracts in `Docs/ProceduralFloors/geometry.md` and `Docs/ProceduralFloors/anomaly.md`; this file is the wider research backlog.

## Current Geometry Baseline

### Living

Current implementation:

- `src/gen/living/apartments.ts`: 128 permanent apartment clusters on a 16x16 supergrid, five layout variants, protected by `aptMask`, shelter walls marked as hermetic.
- `src/gen/living/volatile.ts`: volatile maze rebuilt by samosbor. It places architectural rooms on a supergrid, connects them with MST corridors, fills dense rooms in 7-cell steps, repairs, prunes, shapes rooms, connects apartments, punches shortcut walls, opens volatile doors and places airlocks.
- `src/gen/living/geometry.ts`: readable hub ring around the act hall, district spokes, named landmark routes, lift connections and small motifs.

What works:

- Strong ownership split: permanent apartments plus volatile megastructure.
- Good player readability near hub.
- Real samosbor contract: volatile maze can regrow without deleting apartment shelters.

Geometric weaknesses worth improving:

- Permanent apartment positions are still visibly supergrid-based.
- Volatile fill is dense but largely rectangular and local; macro topology emerges from repair more than from authored graph intent.
- Hub geometry connects named rooms by string needles, which is useful now but should not become the only readability method.
- Corridor generation often relies on L-corridors and repair passes rather than weighted routing.

Best upgrades:

- Add a generation-time macro graph before volatile rooms: ring/spoke/bypass/dead-end reward roles, then stamp rooms into it.
- Replace random apartment supercell placement with BSP or Poisson-disc apartment block placement while keeping `aptMask`.
- Use weighted connector routing for permanent room access instead of only outward straight carving.
- Score hub readability through route metrics: spawn to Olga/armory/lab/market/lift paths, not just carved cells.
- Add social density fields around hub districts using existing `population_placement.ts` anchors.

### Kvartiry

Current implementation:

- `src/gen/kvartiry/index.ts`: all cells start as floor; regular `WALL_L=4` source grid grows wall segments; doors are placed mid-segment; connectivity flood opens doors; room records are discovered by flood-fill; zones, lifts, population fields and content manifest rooms follow.
- Runtime pressure is bounded through `kvartiry_population_pressure`, interval checks and capped uprising conversion/response.

What works:

- The wall-source algorithm gives dense residential pressure immediately.
- Room flood-fill produces many small rooms suitable for crowd and queue pressure.
- Population uses whole-floor natural placement rather than pile spawning.

Geometric weaknesses worth improving:

- The `WALL_L=4` regularity can make the floor read as one texture of tiny boxes.
- Macro routes are less deliberate than the social content; riots and queues could be spatially legible before NPCs are added.
- Lifts are placed after room assignment repair, which works but does not express queue geometry around them as a primary structure.

Best upgrades:

- Add a macro social graph over the grid: ration queue loops, kitchen fronts, water riot basins, barricade cuts, evacuation lanes.
- Apply Potts/Ising social domains over the room grid: citizen, wild, liquidator, shortage, shelter phases.
- Use BSP Khrushchev sectors to create occasional larger apartment slabs inside the dense wall-grid floor.
- Add braided Wilson paths as queue/crowd corridors so the player can choose crowd, service, or apartment cut-through routes.
- Add chokepoint scoring so one door cannot accidentally own the entire social route.

### Manhattan Crossroads

Current implementation:

- `src/gen/design_floors/manhattan_crossroads.ts`: authored route id `manhattan_crossroads`, fixed avenue/street centers, road spans, sidewalks, crosswalks, overpass, underpass, toll gate, side rooms, quest NPCs, traffic bands and route shell expansion.
- `Docs/DesignFloors/rework_floor_09_manhattan_crossroads.md` already identifies this as one of the strong floors and asks for denser traffic.

What works:

- Strong identity: roads, crosswalks, wrong turn, toll gate, overpass/underpass.
- Good route decisions: pay/steal/bypass/escort/fight.
- Road geometry creates line of sight and chokepoints not present in apartment floors.

Geometric weaknesses worth improving:

- It is highly coordinate-authored; variants are limited.
- Road graph is mostly orthogonal; false-road weirdness is added by rooms/signs more than graph mutation.
- Traffic density is more important than more road cells, but geometry should provide crowd islands and alternate fronts.

Best upgrades:

- Convert fixed road spans into a parameterized road-graph generator for future variants while preserving the current authored map.
- Add Hough/Radon line families for false diagonal roads, scan-line streets or one-way sight corridors.
- Use line-of-sight heatmaps to place cover, toll crowds and monster spill points.
- Use local search for traffic islands: risk, reward and exit should form separated decision triangles.
- Use zone-dual graph to make liquidator/citizen/wild territory legible at intersections.

### Hell And Meat Lower

Current implementation:

- `src/gen/hell/index.ts`: organic cave field built from coarse/medium/fine hash noise, Ising-like parity sweeps, organic branch walkers, smoothing, thinning, spawn disc and organic textures.
- `src/gen/hell/geometry.ts`: authored chains of arenas, fallback loops, reward pockets, scars, bone bridge, vent throat, safe shortcuts and route cues.
- `src/gen/design_floors/underhell.ts` and `src/gen/design_floors/podad.ts`: lower-route authored floors with thresholds, gates, living tunnels, wall snake and section shift style topology.

What works:

- Hell already uses interesting math: Ising-like cave field plus organic branch walkers.
- Arena chains have meaningful combat rhythm: entry, threat pocket, fallback, reward.
- Podad reuses generic dynamic topology systems instead of adding Podad-only frame logic.

Geometric weaknesses worth improving:

- The organic base field and authored arena graph could be more coupled: currently one is broad terrain and the other is the readable route layer.
- Meat geometry can become samey if every route is tunnel/ellipse/fallback.
- Samosbor pressure needs clear shelter/retreat math even in hostile lower floors.

Best upgrades:

- Use reaction-diffusion and capillary growth as texture/topology overlays, not just random organic tunnels.
- Add tissue tension fields: paths bend along gradients between cult anchors, liquidator footholds, meat hearts and lifts.
- Use evolutionary arena-chain scoring: every chain needs entry, exit, fallback, reward, unique sightline and local counterplay.
- Use BFS/SDF shelter shells to make corrupt safe zones readable.
- Apply Potts phase domains to lower floors: meat, bone, ash, liquidator scar, cult heat.

Split target:

- `HELL` story anchor should stay the readable combat descent: arena graph, fallback loops, corrupt shelter shells, material-phase cues.
- `underhell` should be the threshold contract: tribute gates, social/religious fronts, liquidator scars, escape math.
- `podad` should be dynamic topology pressure: living tunnel graph, wall-snake cuts, section-shift chambers and monster anchors.

### Ministry

Current implementation:

- `src/gen/ministry/index.ts` starts from a coarse maze/backtracker style bureaucracy skeleton, then stamps offices, corridors, archives, portraits, carpet language and Ministry-specific rooms.
- Ministry is also the natural base for `archive_warrens`, `admin_pockets`, `attic_weatherworks`, `raionsovet_archive`, `upper_bureau`, `bank_floor`, `registry_morgue` and number/document route floors.

What works:

- Strong floor fantasy: documents, doors, offices, queues, clerk windows, permits and hostile legibility.
- Maze pressure already exists, so future work can improve rather than replace it.
- Room types and documents can create spatial objectives without needing new runtime systems.

Geometric weaknesses worth improving:

- DFS-like macro corridors can show algorithmic bias and may produce long sameness before a landmark appears.
- Bureaucratic gameplay wants multiple legal/illegal/social paths, but ordinary maze trees can make one corridor own too much progression.
- Archive, queue, registry and office geometries are currently related by theme more than by explicit graph contracts.

Best upgrades:

- Add `Ministry / Bureaucratic Maze` as a reusable macro-profile: queue halls, private office tiers, archive shelves, staff-only chords and document windows.
- Use Wilson or randomized Prim for archive stacks where fairness matters; use recursive division or BSP for office slabs where administrative legibility matters.
- Add landmark nodes by graph depth and centrality: portrait hall, clerk cage, copying room, seal cabinet, complaint pit, permit window.
- Treat permits/keys as graph constraints: the lift backbone remains ungated, while locks open optional chords, vault leaves or dangerous shortcuts.
- Add modular arithmetic or Cayley-graph layouts for specialist registry floors so document order becomes spatial, not just textual.

### Maintenance / Collectors

Current implementation:

- `src/gen/maintenance/index.ts` already uses a coarse tunnel/pipe maze rhythm and industrial room stamping.
- Procedural ids `collectors`, `workshops`, `service_spines` and `sump_causeways` all point at Maintenance as the base floor.

What works:

- Pipes, canals, machine rooms, panels and flooded routes naturally support repair/steal/reroute decisions.
- Industrial spaces tolerate long corridors better than residential floors because valves, pumps and rails can mark distance.

Geometric weaknesses worth improving:

- Tunnel mazes can collapse into one texture of pipes unless water, pressure, rail and service layers have different graph roles.
- Pseudo-vertical features such as ducts, bridges, underpasses and shafts need 2D conventions so they do not look like broken tiles.
- Maintenance wants route repair decisions, but graph state must remain generation-time or bounded local runtime.

Best upgrades:

- Split industrial routes into four graph layers: public service spine, pipe labyrinth, water/causeway basin and emergency-panel chord.
- Use Growing Tree, Eller and Hunt-and-Kill variants for tunnel families; place substations at hunt jumps, row joins and high-betweenness junctions.
- Add drainage erosion over a proxy height field for `collectors` and `sump_causeways`.
- Use tensor spines for cable/duct corridors and local-search factory lines for `workshops`.
- Express 2D pseudo-weaves as bridge rooms, dogleg crossings, paired underpass chambers, rail gates or local lift/teleport pairs, never as hidden z-state in the renderer.

### Void

Current implementation:

- `VOID` is a story/base floor at the bottom of the route, with late pressure, sparse readability and endgame constraints.
- Nearby route floors include `darkness` at z=-48 and NPC-free bands via `floorRunZAllowsNpcs()`.

What works:

- The floor can be geometrically sparse without violating the building fantasy: protocol chambers, missing concrete, black corridors and islands.
- Low population pressure is a feature, not a missing spawn table.

Geometric weaknesses worth improving:

- Sparse maps are easy to make boring or unreadable if "empty" just means fewer rooms.
- Darkness and Void need honest navigation: the player can be afraid and underinformed, but route-critical geometry must still be testable.
- Boss/protocol arenas need retreat and light-resource math, not only a large open room.

Best upgrades:

- Build a sparse island graph: protocol rooms, light pockets, dead lamp rows, false corridors, final arena shell and fallback bridges.
- Use percolation and largest-component extraction for broken concrete islands, then add explicit bridges for spawn/lift/protocol reachability.
- Use BFS reveal/light shells: safe light pocket, warning penumbra, pressure dark.
- Add sound-path and line-of-sight descriptors so the player can choose light, listening, fast crossing or retreat.
- Keep NPC-free identity for late route bands; monsters and events should be bounded and readable.

### Procedural Route Floors

Current implementation:

- `src/data/procedural_floors.ts`: 10 geometry profiles, 5 majority factions, 19 anomaly profiles and route danger/pressure selection.
- `src/gen/procedural_floor.ts`: random room placement, room shaping, toroidal MST plus extra corridors, zones, loot, population, lifts, emergency panels and anomaly application.
- `src/gen/population_placement.ts`: generation-time dense placement fields with tileable value noise, anchors, smoothing, bucket caps and strata sampling.

What works:

- The definition layer already combines geometry, faction and anomaly tags.
- Anomaly library is broad and already includes fractal, Conway, section shift, living tunnels, rail trains and Bad Apple.
- Placement fields are the right foundation for density gradients.

Geometric weaknesses worth improving:

- Most geometry ids still share one rectangle-packing pipeline.
- Tags change loot/monster mood more than actual macro geometry.
- `connectRoomsMST()` plus random extra links is reliable but not expressive enough for 75 route stops.

Best upgrades:

- Give each geometry id at least one macro-layout rule, not just a room mix.
- Add MAP-Elites-style descriptor diversity across procedural z-stops.
- Add graph metrics and geometry fingerprints to prevent "new tag, same map" drift.
- Use new algorithms as profiles: `tensor_spines`, `drainage_erosion`, `bsp_blocks`, `wilson_warrens`, `voronoi_cells`, `hilbert_depot`.

## Authored Route Floor Geometry Atlas

These are shipped string-id route stops, not new `FloorLevel` values. Manhattan is already the strongest model; the rest should move toward the same standard: geometry identity, player decision, route cues, bounded state and validation hooks.

| Route id | Geometry identity | Algorithm stack | Player-facing decisions | Integration caution |
| --- | --- | --- | --- | --- |
| `roof` | roof archipelago, sheds, exposed slabs, sky pressure | Poisson/BSP roof islands, LOS heatmap, Hough antenna lanes, BFS shelter shells | cross exposed slab, use hatch, repair/steal signal gear, hide from long sight | keep sky visuals render-generic; preserve playable island slots and lift access |
| `chthonic_attic` | crawlspaces, storage ribs, old roots, shrine niches | capillary/DLA roots, Wilson-braided crawl graph, low-ceiling SDF shells | cut/feed root, burn/use shrine, steal relics, escort through crawlspace | preserve one wide combat path plus stealth crawl path |
| `antenna_court` | signal yard, cable rings, repeater sectors | weighted Voronoi antenna cells, tensor cable spines, Hough signal corridors | calibrate, jam, record, expose, protect/betray signal enclave | scientist/liquidator pockets only; publish compact signal events |
| `pioneer_camp` | camp square, service buildings, concrete forest trails | camp loop grammar, trail loops, Poisson forest, BFS safe-trail shells | verify roster, repair loudspeaker, choose medpost/canteen outcome, risk old cabin | no schedule sim; use route rooms and shared population placement |
| `upper_bureau` | office tiers, queues, staff balconies, permit cuts | macro-WFC/BSP admin tiers, serpentine queues, min-cut gates, zone-dual fronts | appointment, bribe, forge, expose, erase name, staff-route stealth | no single locked edge may own progression |
| `bank_floor` | teller lanes, deposit rooms, debtor queues, vault shells | debt-circuit loop graph, queue fields, min-cost bypass, vault risk SDF | wait, bribe, deposit, borrow, repay, forge debt, steal vault | no new economy ledger; use bounded ownership/events |
| `raionsovet_archive` | stack canyons, reading pits, clerk windows | macro-WFC shelf motifs, Wilson-braided archives, zone-dual clerk/guard borders | file, steal, forge, expose, swap identities, protect witness, burn record | avoid blind maze bloat; keep document ids compact |
| `registry_morgue` | drawer canyon, tag switchbacks, cold vaults | Hilbert tag order, cold-room SDF shells, Potts living/dead/contaminated domains | identify body, forge tag, steal medicine, expose swap, escort relative | systemic horror, not gore; medical loot stays owned/locked |
| `slime_nii` | containment cameras, wet cells, clean bypasses | Gray-Scott slime bands, Voronoi sealed chambers, dry bypass graph, drainage wet cells | inoculate, harvest sample, burn slime bridge, free/abandon volunteers | no per-frame growth; feed existing slime/profile hooks |
| `manhattan_crossroads` | road graph, crosswalks, false exits, toll control | road graph, Radon/Hough false roads, LOS heatmap, traffic-island local search, zone-dual borders | pay toll, escort crosswalk, rob cargo, repair lights, take wrong exit | canonical complete model; no vehicle simulation |
| `communal_ring` | ring corridor, through-flats, service knots, courtyard void | domestic loop grammar, pass-through BSP, Potts grievance domains, service SDF shells | clean, steal, trade, hide, expose notice, ration pantry, repair primus | distinct from Kvartiry; no background refill |
| `floor_69` | public/backstage/debt/refuge loops, raid shutters | ownership heatmap, public/backstage graph, debt/refuge min-cuts, visibility fields | protect or profit from blackmail, handle raid roster, use clinic/refuge, clear/forge debt | non-graphic adult boundary; no minors; capped population profile |
| `black_market_88` | bazaar lattice, auction pit, service guts, smuggling chords | scale-free market hubs, small-world alleys, shutter min-cuts, queue/density fields | password entry, buy, steal, take debt, hide courier, survive raid shutters | cap heat/trust/debt; no high-tier loot flood |
| `production_belt` | factory lines, dock loops, catwalk bypasses | tensor conveyor spines, dock loop grammar, local-search factory lines, hazard/shelter SDF | repair, sabotage, work shift, steal output, reroute supply, escort worker | no live conveyor physics; use factory ids/cooldowns/events |
| `service_floor` | machine maze, staff routes, ducts, cable trenches | utility graph, tensor ducts/cables, drainage pressure basins, panel/front zone-dual graph | repair lift, reroute access, steal keys, use ducts, restore power | no `main.ts` lift hacks; panel effects bounded and dirty-flagged |
| `silicon_net_well` | NET core rooms, radial pods, crystal corridors, well shaft | radial Voronoi pods, Hilbert/circuit traces, crystal/Gray-Scott bands, vault SDF | help Sibo, steal GBE, betray scientist, hack, provoke Safeguard | hack backlash cooldown-bounded; GBE remains bounded beam deletion |
| `dark_metro` | line Ys, ticket halls, transfer web, defended platforms | parallel rail graph, transfer web, schedule-state graph, Hough tunnels, lit-platform BFS shells | ride/walk, wait/flee, lure monsters to rails, rescue stranded NPC | preserve train/crush mechanics and platform readability |
| `underhell` | combat threshold, tribute gates, social scars | evolutionary threshold chain, capillary root tunnels, tribute/shelter SDF, Potts cult/liquidator/meat domains | pay/refuse tribute, free/silence witness, burn debt, retreat | rare human groups only; ritual gate cannot softlock |
| `podad` | living tunnels, moving walls, lower gate pressure | capillary meat field, section-shift graph, moving-wall chokepoint scoring, monster anchors | fight Heralds, time walls, bait monsters, use living tunnels, retreat/open lower route | use existing topology systems; no ordinary NPC field |
| `darkness` | dead lamps, light pockets, listening routes, protocol dark | small light-resource graph, BFS reveal shells, sound-path graph, sparse Radon sight corridors | spend light, listen, flee, follow protocol, abandon loot, preserve name | keep NPC-free late-route identity; validate low-light readability if implemented |

## Procedural Route Geometry Matrix

Every procedural route floor should be the product of three visible layers: `geometryId`, `majorityId` and `anomalyId`. The current route system already has 10 geometry ids, 5 majority ids and 19 anomaly ids including `none`; the missing step is to make each id change macro geometry, not only tags and loot/monster bias.

### Procedural Geometry Profile Matrix

| `FloorGeometryId` | Current fantasy | Macro rule to add | Best math | Decision shape |
| --- | --- | --- | --- | --- |
| `living_blocks` | ordinary residential cut | BSP/Poisson apartment blocks with service chords | BSP, loop grammar, weighted connectors | home route, public route, service cut, shelter spur |
| `apartment_pressure` | dense Kvartiry pressure | recursive-division social slabs plus queue loops | recursive division, Potts domains, braided maze | legal door, crowd route, lockpick, barricade detour |
| `communal_knots` | shared kitchens and crowd knots | ring/loop grammar around kitchens, water, pantry and smoking rooms | small-world graph, Potts grievance domains | join crowd, use through-flat, steal pantry, expose notice |
| `attic_weatherworks` | roofline vents and wind | tensor cable/duct spines with crawl branches | tensor fields, DLA roots, LOS scoring | exposed service run vs crawl bypass |
| `archive_warrens` | papers, records, shelves | Wilson/Prim archive maze with landmarks and document chords | maze family, macro-WFC, modular lattice | fair maze, clerk shortcut, locked document vault |
| `collectors` | pipes, drains, black water | drainage basin graph and dry causeways | erosion, Reeb/Morse graph, weighted routing | wet shortcut, dry long path, valve reroute |
| `workshops` | machines and repair rooms | factory cells, dock loops, tool-room chords | local search, tensor lines, graph products | work/repair/sabotage/steal route |
| `sump_causeways` | flooded descent | percolation islands plus causeway repair | percolation, erosion, SDF shelter shells | bridge repair, contaminated crossing, stash island |
| `admin_pockets` | small Ministry fragments | office BSP pockets linked by staff-only chords | BSP, recursive division, min-cut gates | legal queue, staff stealth, document theft |
| `service_spines` | transit and power corridors | long tensor spines with bounded side chambers | tensor fields, graph products, Growing Tree | fast exposed trunk, slow utility bypass, panel reroute |

### Procedural Majority Spatial Rules

| `FloorMajorityId` | Geometry imprint | Placement rule |
| --- | --- | --- |
| `citizens` | public loops, kitchens, shelters, witness pockets | density gradients around services, no silent refill, more escape routes than combat pits |
| `liquidators` | checkpoints, patrol triangles, weapon rooms, blocked cuts | high-control fronts on zone-dual borders, readable bypasses and bribe/permit gates |
| `wild` | broken shortcuts, stash leaves, ambush chords, ruined services | more risky chords and dead-end rewards, but lift backbone stays reachable |
| `scientists` | lab cells, clean/dirty borders, sample corridors, observation rooms | Voronoi/quarantine cells, sealed optional rooms, bounded experiment arenas |
| `cultists` | ritual rings, false shelters, tribute gates, phase boundaries | Potts/Ising domains, looped processions, optional sacrificial shortcut, no hard softlock |

### Procedural Anomaly Geometry Overlay Matrix

| `FloorAnomalyId` | Geometry overlay | Runtime/protection caution |
| --- | --- | --- |
| `none` | no overlay; pure geometry/faction test case | keep as baseline for forced-spec tests |
| `smog` | curl-smog plumes, low-visibility lanes, filter pockets | fog changes mark fog dirty; no full-world runtime advection |
| `teleport_cells` | paired seamlets, dislocated cells, shortcut islands | publish/mark topology clearly; lift backbone remains non-teleport-dependent |
| `mushroom_mycelium` | Gray-Scott patches, root corridors, food/spore basins | no unbounded growth; contaminate bounded rooms/cells |
| `hladon` | cold shells, heat-counter rooms, frost corridors | local temperature/fog bands only; readable warm shelters |
| `false_safe_block` | shelter shell that lies, quiet rooms, cult boundary | preserve hermetic semantics unless explicitly marked false-safe |
| `mirror_run` | paired rooms, mirrored labels, parity gates | use visible tells; avoid hidden renderer-only flips |
| `radio_chess` | checker/timing arenas, radio-controlled gates | local timing buffers; no whole-floor tick math |
| `conveyor_sorter` | item lanes, sorting loops, industrial side belts | movement local/capped; no live factory sim |
| `fractal_floor` | recursive blocks, Cantor/Sierpinski gaps, self-similar loops | largest component plus bridges; path entropy must stay sane |
| `cement_memory` | no-backtracking trail, pressure traces, route scars | route pressure local/sparse; never seal both lifts behind memory |
| `wall_snake` | moving wall predator corridor, crush lanes | use existing dirty flags/topology systems; bounded arena/radius |
| `living_tunnels` | capillary tunnel buds, living bypasses, repair scars | protect route anchors; avoid double-spawning monsters |
| `rail_trains` | rail graph, platforms, crossings, lit shelters | preserve train/crush rules; platform safety readable |
| `bad_apple_world` | media/screen topology, black-white cell bands | screen/video state local; no render-owned gameplay |
| `zombie_apocalypse` | quarantine rings, crowd funnels, infection Voronoi cells | no refill-to-cap; infected actors have explicit reason/caps |
| `section_shift` | movable section graph, torus seam cuts, crush pockets | mutation must bump cell/surface/feature versions and repair route |
| `conway_life` | cellular arenas, living/dead topology waves | local typed arrays only; protect lifts, doors and player-adjacent cells |
| `samosbor_seed` | meat/slime breach, protected-shell contrast, regrowth scar | preserve `aptMask`, hermetic walls, lift buttons and route anchors |

### Numbered Lift Instance Geometry

Rare numbered lift instances should be treated as local route flavors, not new base floors. Candidate families:

- `404`: missing rooms, null corridors, dead links, explicit repair bridge.
- `556`: repeated service digits, modular corridor rhythm, wrong-number doors.
- `777`: lucky shrine loops, reward leaves, false-safe shelter shell.
- `1337`: circuit/Hilbert service graph, terminals, parody of clean hacker route.
- `013`: bad apartment superstitions, recursive flats, mirror pairs.
- `089`: cold/registry/morgue adjacency, drawer index maze.
- `000`: void rehearsal, sparse light pockets, no social refill.
- `912`: emergency call route, siren corridors, response chokepoints.

## Algorithm Library

These algorithms are candidates for future implementation. They are intentionally written as generation-time tools unless explicitly marked runtime-bounded.

### Toroidal Delaunay-Lite Room Graph

Purpose: replace pure random room packing with a room-anchor graph that respects toroidal distance.

Method:

- Sample anchors with toroidal Poisson-like rejection.
- Connect each anchor to `k=6..10` nearest neighbors by `world.dist2`.
- Keep a Prim MST for guaranteed connectivity.
- Add extra edges by local relative-neighborhood checks to create loops.
- Stamp rooms around anchors, then carve weighted corridors along accepted edges.

Parameters:

- `anchorCount=48..140`
- `minAnchorDist=24..72`
- `loopRatio=0.12..0.35`
- `corridorWidth=1..3`

Best targets:

- `archive_warrens`
- `admin_pockets`
- `workshops`
- future floor: `voronoi_quarantine`

Key risk: true Delaunay triangulation would be overkill and dependency-hostile. Use k-nearest and local empty-circle approximations.

### BSP Khrushchev Sectors

Purpose: create readable residential/bureaucratic slabs without hand-authoring every flat.

Method:

- Partition large blocks into rectangular sectors.
- Recursively split into flats/offices/service shafts.
- Reserve corridor strips along split boundaries.
- Door degree controls social density and privacy.
- Optional service voids become shortcut shafts or samosbor weak points.

Parameters:

- `blockSize=96..256`
- `splitDepth=4..7`
- `corridorWidth=2..5`
- `doorDegree=1..3`
- `serviceVoidChance=0.05..0.16`

Best targets:

- `Living` permanent apartments
- `Kvartiry` macro slabs
- procedural `living_blocks`
- procedural `apartment_pressure`

Torus risk: wrapped rectangles are awkward. Prefer placing BSP blocks away from seams or split wrapped rooms into non-wrapped stamps.

### Wilson Maze With Braiding

Purpose: produce uniform mazes with fewer DFS artifacts.

Method:

- Run loop-erased random walks on a coarse toroidal grid.
- Rasterize the coarse spanning tree into cell corridors.
- Add braid edges to remove excessive dead ends.
- Add stubs only where reward pockets need dead-end tension.

Parameters:

- `gridCell=8..24`
- `corridorWidth=1..2`
- `braidChance=0.08..0.30`
- `stubChance=0.02..0.12`

Best targets:

- Ministry archives
- Maintenance service floors
- dark metro/service variants
- side branches in Living volatile maze

Invariant: the coarse graph should be connected before rasterization; after rasterization, run door/lift/connectivity sanitation.

### Maze Family Gap: Labyrinths And Branching Mazes

The current backlog cannot stop at "add Wilson maze". Maze choice is itself a design language.

- Perfect mazes: use one spanning tree over a coarse room/corridor grid, then rasterize. They create dread and pursuit cost, but route choice is weak unless dead ends hold reward, clues, keys or retreat risk.
- Braided mazes: start from any perfect maze and open selected dead ends into loops. This should be a generic post-pass, not only a Wilson option. Best for Living public lanes, Kvartiry queues and Maintenance service bypasses.
- Unicursal labyrinths: one continuous path, not a branching maze. Good for ritual queues, Hilbert depots, Ministry protocol lines and cult processions. Decisions come from breaking chords, entering service cuts or stealing queue position.
- Recursive division: begin with open space, recursively add walls and one or more gates per split. Best for apartments, offices and detention blocks where walls feel built rather than cave-grown.
- Randomized Prim: frontier-based and bushier than DFS. Good for archive shelves and communal knots where many short alternatives are better than one long snake.
- Kruskal / DSU maze: shuffle weighted edges, union components and keep accepted edges. Useful when edges already mean pipe route, public corridor, faction border, water crossing or locked shortcut.
- Wilson: uniform spanning tree via loop-erased random walks. Best for fair-feeling archives and route floors where DFS bias is too visible.
- Aldous-Broder: unbiased but usually too slow/noisy for large coarse grids. Keep for tiny surreal rooms, tests or reference output.
- Growing Tree: one implementation with `newest`, `oldest`, `random` and mixed selection weights. It can emulate DFS, Prim-ish bushiness or long arterial corridors.
- Eller: row-streaming maze with low memory, useful for huge regular tunnel sheets. For torus support, the final row must union back to row 0 deliberately.
- Hunt-and-Kill: long wandering corridors with occasional hunts to a fresh frontier. Good for service tunnels because substations can sit at hunt transition points.
- Weave mazes: true over/under crossing is not native to the 2D `World`; use pseudo-weaves through dogleg crossings, bridge rooms, underpass pairs, rail gates or local teleport/lift pairs.
- Keys and locks: treat locks as graph constraints. The spawn-to-lift backbone stays ungated; keys are placed on the accessible predecessor side; locked edges become optional chords, vault leaves or dangerous shortcuts.
- Landmarks: every serious maze needs graph-visible anchors chosen by depth, centrality, dead-end value and loop junctions. Use screens, lights, portraits, machines, water, route cues or faction fronts.
- Toroidal constraints: all neighbor math must wrap. Recursive division should choose an artificial cut seam and stitch gates after generation; Kruskal, Prim and Wilson can include seam edges normally, but quality gates must test seam metadata.

Floor mapping:

- Living: braided/growing-tree public lanes around protected apartments.
- Kvartiry: recursive-division social blocks plus braided queue loops.
- Ministry: Prim/Wilson archive trees with landmark offices and locked document chords.
- Maintenance: Growing Tree, Eller and Hunt-and-Kill tunnel variants with pseudo-weave rail/service crossings.
- Procedural floors: per-`geometryId` maze branches, not another shared rectangle pack.

### Macro-Tile WFC

Purpose: use constraint propagation for repeated-but-wrong blocks without running WFC over one million cells.

Method:

- Run WFC on a 16x16 or 32x32 supergrid.
- Tiles are motifs with N/E/S/W openings, room types, feature hints, density hints and route tags.
- Rasterize the selected tile pattern into rooms/corridors.
- Retry/backtrack with a hard cap, then deterministic fallback.

Parameters:

- `tileSize=16|32`
- `tileSet=20..60`
- `retries<=8`
- `backtrackCap` per profile
- required openings near lift anchors

Best targets:

- archive shelves
- service shafts
- repeating residential blocks
- false-safe procedural blocks

Rule: never cell-WFC over 1024x1024.

### Planar Loop Grammar

Purpose: ensure readable expedition choices before raster carving.

Graph motifs:

- main ring
- spoke
- bypass loop
- dead-end reward pocket
- locked shortcut
- shelter spur
- faction front
- one-way false route

Parameters:

- `mainLoops=1..3`
- `spokes=4..12`
- `rewardLeaves=3..10`
- `lockedCutEdges=0..6`
- `minBypassLength=40`

Best targets:

- Living hub extensions
- Hell arena chains
- black market routes
- service floor
- future harmonic bathhouse

Invariant: no spawn/lift path may depend on one locked edge unless a non-gated return path exists.

### Weighted Connector Routing

Purpose: replace awkward long L-corridors and accidental protected cuts.

Method:

- Run generation-time bounded shortest path in a search box around endpoints.
- Costs:
  - existing corridor/floor: `1`
  - room floor: `3`
  - mutable wall: `8`
  - near container/control: high
  - `aptMask`, hermetic walls, lift cells: forbidden
- Rasterize the path, placing doors only at coherent room boundaries.

Parameters:

- `searchMargin=64..192`
- `wallCost=8`
- `corridorCost=1`
- `roomCost=3`
- `protectedCost=Infinity`

Best targets:

- Living apartment access
- procedural room links
- design-floor shell expansion
- POI entrance repair

Fallback: current L-corridor if bounded search fails.

### Zone-Dual Gameplay Graph

Purpose: make faction zones and generated geometry talk to each other.

Method:

- After `generateZones()`, scan zone borders.
- Build an adjacency graph of zones.
- Mark high-conflict edges based on factions, level and nearby rooms.
- Place airlocks, patrol fronts, warning cues, gates and density anchors on selected edges.

Parameters:

- `borderSampleStep=4..8`
- `airlocksPerCut=0..2`
- `frontierWeightByFaction`
- `safeZoneDegreeMin=2`

Best targets:

- Kvartiry riots
- Manhattan traffic control
- procedural faction floors
- future Voronoi quarantine

Rule: this graph is derived after generation and is not runtime-maintained.

### Tensor Spines

Purpose: corridors follow a smooth directional field rather than Manhattan trunks.

Method:

- Build a 256x256 vector/tensor grid from tileable value noise.
- Angle = `noise * PI + routeBias`.
- Trace 6-14 streamlines.
- Carve 2-3 cell bands only through mutable cells.
- Treat streamlines as extra corridors after ordinary room connectivity.

Parameters:

- `roomCount=56..74`
- `streamlines=6..14`
- `step=2..4`
- `maxLength=120..260`
- `minRoomDistance=40`

Best targets:

- `service_spines`
- `attic_weatherworks`
- future `tensor_spines` procedural geometry

Runtime: none.

### Drainage Erosion

Purpose: fake basins, channels, flooded corridors and dry causeways.

Method:

- Generate 256x256 height field by FBM/value noise.
- Run 8k-24k generation-time droplets for 12-48 steps.
- Convert lowest reachable mutable bands to water.
- Keep dry margins around spawn, lifts, doors and panels.
- Use flow accumulation to place causeways and valves.

Parameters:

- `heightScale=48..192`
- `droplets=8000..24000`
- `dropletSteps=12..48`
- `waterPercent=0.08..0.18`

Best targets:

- `collectors`
- `sump_causeways`
- future `critical_leak_archive`

Runtime: none. Water remains ordinary passable world state.

### Potts / Ising Domains

Purpose: create blocky phase domains for faction/material/social pressure.

Method:

- Run Potts model on 128x128 or 256x256 coarse grid.
- States: 3-5 phases.
- Anneal 32-96 sweeps.
- Bias one phase by floor majority/faction/anchor.
- Upsample boundaries into floor texture, fog, zone influence, optional walls or doors.

Parameters:

- `states=3..5`
- `temperature=1.4 -> 0.35`
- `sweeps=32..96`
- `boundaryWidth=1..3`

Best targets:

- Kvartiry social domains
- Hell meat/bone/scar phases
- procedural anomaly `potts_blocks`
- future Voronoi quarantine district politics

Runtime: preferably none. If toggled by apparatus, change bounded selected rooms only.

### Gray-Scott Reaction Diffusion

Purpose: organic spots, stripes, wormy concrete, slime patches and lab-grown routes.

Method:

- Run Gray-Scott on 256x256 coarse grid.
- Seed patches around bathrooms, water rooms, mushroom rooms, samosbor residue or lab apparatus.
- Threshold pattern bands into textures, fog, contaminated containers and monster-pressure anchors.

Suggested parameter sets:

- Spots: `Du=0.16`, `Dv=0.08`, `F=0.036`, `K=0.060`
- Worms: `Du=0.14`, `Dv=0.06`, `F=0.050`, `K=0.062`
- Coral: `Du=0.18`, `Dv=0.05`, `F=0.026`, `K=0.055`

Best targets:

- `mushroom_mycelium`
- `samosbor_seed`
- Hell/meat lower overlays
- future `turing_nursery`

Runtime: none unless a bounded anomaly system owns a few tagged rooms.

### Capillary Growth / DLA

Purpose: roots, wires, cracks, mycelium, branching conduits.

Method:

- Place 4-12 roots far from spawn.
- Run bounded DLA walkers in local windows, not whole-world wandering.
- Stick to existing cluster within radius 1-2.
- Use result for visual cracks, optional shortcuts or living-tunnel seeds.

Parameters:

- `roots=4..12`
- `walkers=2000..12000`
- `maxSteps=128`
- `branchJitter=0.10..0.25`
- `targetCells=1000..6000`

Best targets:

- Hell roots
- Podad/static living tunnels
- maintenance wire growth
- future capillary anomaly

Runtime: only descriptors if merged with existing moving tunnel systems.

### BFS / SDF Shelter Shells

Purpose: readable safe/unsafe distance shells around shelters, lifts, smog sources, cold rooms or cult apparatus.

Method:

- Use multi-source BFS over reachable passable cells.
- Treat it as signed-distance-style gameplay bands, not true continuous SDF.
- Threshold into inner safe, warning ring and pressure ring.

Parameters:

- inner: `0..8`
- warning: `9..20`
- pressure: `21..44`

Best targets:

- `false_safe_block`
- `hladon`
- smog
- Hell fallback routes
- Living shelter teaching

Runtime: cache by world version or rebuild generation-time; no per-frame BFS.

### Curl Smog

Purpose: fog plumes that look like flow instead of blobs.

Method:

- Generate tileable scalar potential.
- Compute curl by finite differences on 256 grid.
- Advect 4k-10k fog particles for 24-64 steps.
- Stamp bounded fog cells with decay.

Parameters:

- scales: `64, 128, 256`
- `particles=4000..10000`
- `steps=24..64`

Best target: upgrade existing `smog`, not a new profile.

Requirement: `world.markFogDirty()` after generation.

### Cyclic Cellular Automata

Purpose: timing hazard distinct from `conway_life`, without topology mutation.

Method:

- Tag 1-3 bounded arenas.
- Each cell has 3-6 states.
- A state advances when enough neighbors are successor state.
- Visual/fog/light/floor hazard phases update on fixed cadence.

Parameters:

- `states=4|5`
- `arenaSize=12x12..48x48`
- `neighborThreshold=2`
- `tick=0.6..1.2s`

Best targets:

- procedural anomaly `cyclic_cellular`
- radio/chess-like timing rooms
- lab and Ministry math rooms

Runtime: local `Uint8Array` buffers per arena only.

### Hilbert / Peano Space-Filling Floors

Purpose: make index-distance and Euclidean distance disagree.

Method:

- Generate Hilbert/Peano curve over coarse tiles.
- Carve primary curve as safe aisle.
- Add locked chords and risky shortcuts.
- Tie loot quality, patrol schedule or document order to curve index, not straight-line distance.

Best target: new route floor `hilbert_depot`.

Player decision: follow long safe order, break a chord, steal indexed cargo, or reorder segments through a terminal.

### Radon / Hough Line Families

Purpose: floor based on scan lines, long sight corridors and angular topology.

Method:

- Pick seeded angle/radius bins.
- Carve line families through mutable cells.
- Intersections become control rooms, shutters or sniper/monster sightlines.
- One apparatus can rotate/select active line family in bounded local areas.

Best target: new route floor `radon_exchange`.

Player decision: choose visible long line, broken service chord, or shutter manipulation.

### Hyperbolic / Poincare Switchyard

Purpose: non-Euclidean transit fantasy inside the toroidal world.

Method:

- Generate a `{p,q}` tiling or Poincare-like arc graph on a local disk.
- Project arcs into the 1024 grid.
- Horocycle bands become safe platforms.
- Switches enable one arc family while making other apparent exits false/expensive.

Best target: new route floor `hyperbolic_switchyard`.

Implementation caution: gameplay graph can be hyperbolic; actual coordinates still use normal toroidal `World`.

## 2D Mathematical Structure Catalog

Use this as a menu of generation-time structures. Most entries should emit an intent graph or proxy field first, then stamp rooms/corridors/features once.

| Structure | Floor fit | Generation bound | Gameplay decision | Invariants |
| --- | --- | --- | --- | --- |
| Regular and semi-regular tilings | `communal_knots`, `service_spines`, laundries, boiler grids | 16x16 or 32x32 macro tiles | follow public tile symbols or cut through service tiles | openings match, lifts reachable, no cell-WFC |
| Integer lattices | Ministry registries, workshops, Kvartiry blocks | affine lattice over 32-128 anchors | axis route, diagonal illegal shortcut, residue gate | torus wrap math only; avoid one-door global chokepoints |
| Aperiodic/Penrose tilings | `penrose_laundry`, domestic service floors | finite deterministic patch, 256-1024 macro cells | match tile marks to exit/cache | finite fallback; connected rasterization |
| Voronoi / power diagrams | `voronoi_quarantine`, faction districts, labs | 16-80 weighted sites, Lloyd <= 6 | forge pass, cross border, open ridge connector | sites map to zones; Delaunay graph connected |
| Medial axes | caves, flooded archives, slime nurseries | skeletonize passable mask on 256 grid | stay on centerline or risk edge loot | skeleton repaired to lifts; dead branches tagged reward/trap |
| Straight skeletons | bureaucratic slabs, collapsing rooms, roof forms | polygon rooms <= 128, integer edges | open inner chamber as walls shrink | no protected-cell erosion; doors coherent |
| Morse/Reeb graphs | bathhouse, collectors, roof weatherworks | scalar field 128-256, critical points <= 64 | route by basin/saddle/peak risk | graph edges map to reachable corridors |
| Contour maps | heat, flood, fog, pressure floors | 128-256 scalar, 5-9 bands | hot fast path, cold bypass, valve route | bands cannot isolate lifts; dirty flags if mutated |
| Spectral/Laplacian fields | harmonic bathhouse, influence gradients, safe fields | coarse Laplacian 128 grid, iterations <= 512 | adjust boundary valve to change local pressure | runtime changes local only; cache by version |
| Random walks | Wilson warrens, crowd lanes, Hell branches | 64-256 walkers, max steps 128-512 | follow uncertain trail or leave for reward pocket | loop-erased/connected backbone before stamping |
| Levy flights | anomaly routes, black market shortcuts, meat scars | 24-96 jumps, max jump clamped 96 | gamble on long shortcut with poor cover | jumps carve mutable cells only; route repaired after |
| L-systems | roots, pipes, ducts, wires, cult vein maps | depth <= 5, branch budget <= 2048 segments | cut root/pipe branch to reroute hazard | bounded segments; no recursive runtime growth |
| Shape grammars | apartments, public queues, service offices | 20-80 macro productions, retry cap <= 8 | read room sequence tells, interrupt via service door | grammar emits graph first, raster second |
| Quasicrystals | antenna courts, signal floors, strange laundries | 5-8 wave families on 256 grid | align signal corridor or break phase gate | threshold result repaired for reachability |
| Modular arithmetic layouts | `number_registry`, Ministry records | residues over 64-256 rooms/cells | decode modulus, bribe for residue, choose prime route | residue labels are cues, not display-name logic |
| Cayley graphs | permit bureaucracy, `cayley_byuro` | group graph <= 160 nodes | apply forms in order, buy one generator, exploit quotient shortcut | graph connected; legal/illegal paths both visible |
| Graph products | metro/service grids: cycle x path, ring x tree | 2 small graphs, product <= 256 nodes | choose ring loop, vertical spoke or gated product edge | product graph connected; loops preserved |
| Small-world networks | Living volatile maze, black market, service bypasses | base lattice plus 5-20% shortcuts | known slow route vs risky social shortcut | shortcuts cannot bypass required locks unless intended |
| Scale-free networks | markets, bureaucracy hubs, cult networks | preferential attachment 40-160 nodes | control hub, avoid patrol hub, raid supply hub | cap hub degree; hub loss cannot isolate both lifts |
| Percolation | `critical_leak_archive`, flooded collectors | site/bond p near threshold on 128-256 grid | dry long route vs contaminated wet shortcut | largest component includes spawn/lifts or bridges added |
| Sandpile dynamics | `sandpile_perekrytie`, collapsing slabs | coarse Abelian sandpile 64-128 grid | trigger collapse to open shortcut or seal pursuit | runtime topples local/capped; route anchors protected |
| Ising/Potts | Kvartiry social phases, Hell material phases | 128/256 grid, 32-96 sweeps | cross faction/material boundary or exploit phase shelter | phase boundaries produce cues; no runtime full-grid sweeps |
| Cellular automata | local math rooms, `conway_life`, cyclic hazards | 1-3 arenas, 12x12 to 48x48 buffers | time movement, freeze/reset arena, loot during phase | local typed arrays only; protect lifts/doors/player-adjacent cells |
| Strange attractor streamlines | service yards, transit floors, `attractor_dvor` | precomputed 2D projected flow over 128-256 grid | ride flow corridor, flip parameter, cut through dead zone | no per-frame integration over world; switch affects local rooms |

## Existing Floor Improvement Backlog

### Living Improvements

1. Replace apartment supergrid placement with BSP or Poisson-block apartment placement while preserving 128-ish protected clusters.
2. Add a macro route graph for volatile rooms before dense fill: hub ring, market lane, shelter lane, home lane, public lane, service bypasses.
3. Use weighted connector routing for apartment-to-maze access.
4. Score route readability from spawn to core anchors: act hall, armory, Yakov, Vanka, market, nearest up/down lifts.
5. Add BFS shelter shells around hermetic rooms for samosbor teaching.
6. Add MAP-Elites descriptors to volatile maze seeds: open area, loopiness, corridor ratio, shelter distance.
7. Make zone content modules request graph roles instead of raw clear areas where possible.
8. Use density fields for everyday crowds: hub/market/public/shelter, with bucket caps.
9. Add line-of-sight checks around spawn and tutorial rooms so first combat cannot be hidden by geometry noise.
10. Keep all Living upgrades exempt from deleting `aptMask` and hermetic walls.

### Kvartiry Improvements

1. Add a 64-128 node social macro graph over the existing `WALL_L=4` room fabric.
2. Carve queue loops between kitchens, water points, lifts, barricades and print rooms.
3. Use Potts domains for social phases: citizen, wild, liquidator, hunger, shelter, counterfeit.
4. Add Wilson-braided corridors as named public lanes so the player can route around riot fronts.
5. Use local-search POI placement for content-manifest rooms instead of pure nearest/fallback placement.
6. Add articulation checks: no ordinary door should isolate both lift directions or a large social region.
7. Place uprising seed points by field gradients, not random leader only.
8. Add "crowd pressure basins" around ration queues with max bucket caps.
9. Add BSP slab variants to break the uniform tiny-cell grid.
10. Give each major social conflict a geometry footprint: front, bypass, witness pocket, exit.

### Manhattan Crossroads Improvements

1. Keep the current authored floor as the canonical strong example.
2. Build a reusable road-graph generator for future Manhattan-like or false-city floors.
3. Add Hough/Radon false roads as optional route shell expansion.
4. Add line-of-sight heatmap scoring for roads, crosswalks and toll gate.
5. Add traffic-island placement by decision triangle: risk, reward, escape.
6. Use zone-dual graph to mark liquidator, citizen and wild control at road borders.
7. Increase crowd/monster placement through fields, not ad hoc piles.
8. Add diagonal alleys and one-way wrong-turn arcs generated from a graph, not fixed coordinates only.
9. Ensure long sightlines include cover every 24-48 cells unless intentionally exposed.
10. Use route cues for false adjacency: a road can be visible but socially/physically expensive.

### Hell / Meat Lower Improvements

1. Couple Ising cave field to arena-chain graph: field valleys should guide entries, fallback loops and reward scars.
2. Add reaction-diffusion overlays for meat/gut/bone phase identity.
3. Use capillary growth for roots, wires, nerves and tunnel buds.
4. Add Potts domains for cult/liquidator/meat/scar territories.
5. Score every arena chain: entry, threat, fallback, reward, exit, alternate sightline.
6. Add BFS shelter shells for corrupt safety and retreat teaching.
7. Use evolutionary multi-start for chain layouts before stamping.
8. Add one or two non-meat geometries per lower route: ash archive, bone lattice, pressure organ, liquidator scar.
9. Keep lower-floor dynamic topology through existing anomaly systems, not floor-specific frame loops.
10. Protect route lift logic: Podad lower lifts remain gate-controlled and cannot be "fixed" by generic geometry.

### Ministry Improvements

1. Replace single-flavor DFS bureaucracy with selectable archive, queue, registry and office graph roles.
2. Add graph landmarks every 80-160 passable steps: portrait hall, seal cabinet, clerk cage, copying room, complaint pit.
3. Use recursive division and BSP for office/admin slabs; use Wilson or Prim for archive stacks.
4. Add permit/key constraints as optional graph chords, not as required lift-backbone blockers.
5. Add min-cut checks for staff/legal/combat routes so one clerk door cannot own the whole floor.
6. Add modular arithmetic or Cayley-graph specialist rooms for document puzzles.
7. Use zone-dual fronts for liquidator/citizen/clerk conflict lines.
8. Place document rooms by centrality/depth, not purely by rectangle availability.
9. Keep display-name Russian text out of hot logic; use ids, tags and events.
10. Snapshot route metrics: queue length, landmark spacing, archive loop count and locked optional chord count.

### Maintenance / Collectors Improvements

1. Split industrial geometry into service spine, pipe labyrinth, water basin and emergency-panel chord layers.
2. Use Growing Tree and Hunt-and-Kill for tunnel identity; use Eller for row-like collector sheets.
3. Add drainage erosion to `collectors` and `sump_causeways` proxy fields.
4. Use tensor spines for ducts, cables and power routes.
5. Use pseudo-weaves for rail/pipe crossings: doglegs, bridge rooms, underpass chambers or local lift/teleport pairs.
6. Place valves, substations and panels at graph transition points, not random walls.
7. Add dry/wet path decisions around flooded basins.
8. Keep repair/reroute interactions bounded and dirty-flagged.
9. Prevent one pipe choke from isolating both lifts.
10. Add water, pressure and rail overlays to debug views.

### Void Improvements

1. Treat sparse geometry as island graph design, not "fewer rooms".
2. Use percolation/largest-component extraction for broken concrete, then explicit bridge repair for route anchors.
3. Add BFS light/reveal shells and dead-lamp rows.
4. Score sound paths and long dark sightlines separately.
5. Keep NPC-free late-route bands as identity; do not backfill with ordinary actors.
6. Add protocol chambers as landmark nodes with clear retreat logic.
7. Make final/boss arenas include fallback, light pocket, reward edge and exit.
8. Add low-light readability checks before any browser-facing implementation.
9. Preserve route memory through spec ids, not saved derived geometry.
10. Add `darkness` as the transition model between ordinary lower floors and full Void.

### Procedural Floors Improvements

1. Give every `FloorGeometryId` a macro-layout branch.
2. Add `tensor_spines` and `drainage_erosion` as profile candidates.
3. Upgrade `service_spines` with tensor streamlines.
4. Upgrade `sump_causeways` with flow/erosion fields.
5. Upgrade `archive_warrens` with Wilson maze or macro-WFC shelf motifs.
6. Upgrade `communal_knots` with loop grammar and social density fields.
7. Upgrade `admin_pockets` with BSP bureaucracy sectors.
8. Use MAP-Elites descriptors across procedural z-stops.
9. Add geometry metrics snapshots to tests before adding many new profiles.
10. Keep anomaly topology after geometry and before final reachability audit.

## New Floor Concepts

These are route-floor candidates or procedural profile candidates. They must not create new `FloorLevel` enum values. A real implementation would need route data, generator, manifest registration, population profile if needed and focused tests.

### 1. Radon Exchange

Candidate id: `radon_exchange`.

Identity: upper technical transfer floor where corridors are scan lines through concrete. Long line-of-sight corridors are both navigation and threat.

Algorithm stack:

- Radon/Hough line families.
- Seeded angle/radius bins.
- Intersections as control rooms.
- Sparse inverse-projection noise for vaults and blind wedges.

Player decisions:

- Rotate a scanner shutter to open one angle family.
- Cross a visible long line under sniper/monster pressure.
- Use a broken service chord.
- Steal projection keys from liquidators.

Integration:

- Authored design floor or procedural geometry branch.
- Base floor likely `MINISTRY`.
- Route cue for line alignment.
- No runtime scan math; only bounded shutters if interactive.

### 2. Voronoi Quarantine

Candidate id: `voronoi_quarantine`.

Identity: medical/civic quarantine split into cells around clinics, kitchens, checkpoints and corpse pits. Every district belongs to a nearest authority.

Algorithm stack:

- Weighted Laguerre/Voronoi sites.
- Delaunay adjacency as corridor graph.
- Lloyd relaxation for less jagged districts.
- Border walls/doors along selected ridges.

Player decisions:

- Forge a pass for one cell.
- Cut through a border door.
- Escort an infected NPC across hostile borders.
- Open a Delaunay connector to reroute supplies.

Integration:

- Zone factions map directly to sites.
- Population fields use site anchors.
- Containers inherit cell tags.

### 3. Hilbert Depot

Candidate id: `hilbert_depot`.

Identity: industrial storage floor where local adjacency lies. The map is close by Hilbert index, not by eye.

Algorithm stack:

- Hilbert or Peano curve over coarse tiles.
- Primary curve as service aisle.
- Locked chords and risky shortcuts.
- Loot quality by curve distance from spawn.

Player decisions:

- Follow the safe full curve.
- Spend tools/ammo on a chord.
- Steal indexed cargo.
- Reorder segment labels through a terminal.

Integration:

- Base floor `MAINTENANCE`.
- Containers can store compact index data in ids/tags.
- Route cues can reveal "wrong-local" cargo.

### 4. Harmonic Bathhouse

Candidate id: `harmonic_bathhouse`.

Identity: bathhouse/boiler civic floor governed by heat, steam and pressure gradients.

Algorithm stack:

- Coarse scalar potential field.
- Jacobi or Gauss-Seidel relaxation.
- Corridors along level sets.
- Steam/fog/water by potential bands.

Player decisions:

- Turn valves to lower one gradient and raise another.
- Pick hot fast path, cold flooded bypass or repair route.
- Use pressure panels before samosbor.

Integration:

- Emergency panels and valve interactions.
- Runtime valve changes must be local and dirty-flagged.
- Population fields bias people to stable potentials and monsters to steep gradients.

### 5. Turing Nursery

Candidate id: `turing_nursery`.

Identity: slime/science floor where reaction-diffusion patterns form rooms, contamination and sample basins.

Algorithm stack:

- Gray-Scott reaction diffusion.
- Threshold bands for glass, slime, floor and sealed lab rooms.
- Skeletonize walkable bands.
- MST repair between anchors.

Player decisions:

- Inoculate one basin.
- Harvest contaminated samples.
- Burn a slime bridge.
- Expose lab growth to create a shortcut with monster pressure.

Integration:

- Could be a routed design floor or anomaly expansion near `slime_nii`.
- Tags feed slime loot and monster ecology.

### 6. Hyperbolic Switchyard

Candidate id: `hyperbolic_switchyard`.

Identity: transit/service floor where signs and adjacency behave like hyperbolic space.

Algorithm stack:

- Poincare-like local tiling.
- Geodesic arcs as rail/service corridors.
- Horocycle bands as platforms.
- Switches select which arc family is open.

Player decisions:

- Pay a guide.
- Flip a switchyard family.
- Take a monster-heavy geodesic shortcut.
- Sabotage a false platform to trap pursuers.

Integration:

- Base floor `MAINTENANCE`.
- Reuse rail/transit tags.
- Route cues warn about false adjacency.

### 7. Critical Leak Archive

Candidate id: `critical_leak_archive`.

Identity: archive at the percolation threshold. One wet cluster barely connects documents, lifts and shelter pockets.

Algorithm stack:

- Critical site/bond percolation.
- Largest component extraction.
- Skeletonized causeways.
- Small bridges where connectivity fails.

Player decisions:

- Carry documents dry through a long path.
- Wade through a contaminated shortcut.
- Raise floodgates.
- Trade dry archive packets for safe passage.

Integration:

- Base floor `MINISTRY`.
- Archive/document tags plus water/blackwater pressure.
- Good fit for generation-only math.

### 8. Penrose Laundry

Candidate id: `penrose_laundry`.

Identity: domestic service floor with aperiodic tiled laundries, boiler rooms and cloth corridors. It is patterned but never repeats.

Algorithm stack:

- Aperiodic macro tiling approximation over 32x32 cells.
- Tiles carry door openings, heat/water labels and room motifs.
- Deflation can create small service pockets.

Player decisions:

- Follow matching tile symbols to a dry exit.
- Break a laundry lock to shortcut.
- Divert steam to expose a hidden washroom cache.

Integration:

- Base floor `LIVING` or `MAINTENANCE`.
- Avoid true infinite tiling; use deterministic finite patch.

### 9. Markov Stairwell

Candidate id: `markov_stairwell`.

Identity: a route stop where room sequence feels probabilistic. The next corridor class depends on the last two rooms.

Algorithm stack:

- Markov chain over room motifs.
- Hidden-state grammar for danger bands.
- Sequence embedded into a loop graph, then rasterized.

Player decisions:

- Learn sequence tells.
- Interrupt the chain through service doors.
- Use a rare state to reach a stash.

Integration:

- Works as procedural geometry profile.
- Deterministic from seed; no runtime Markov process needed unless a local puzzle owns it.

### 10. Number-Theory Registry

Candidate id: `number_registry`.

Identity: Ministry-like record floor organized by residues, modular corridors and prime-indexed offices.

Algorithm stack:

- Modular lattice patterns.
- Residue classes map to room types.
- Prime gaps define locked office spacing.
- Chinese-remainder intersections become document hubs.

Player decisions:

- Decode residue route.
- Bribe a clerk for one modulus.
- Choose shorter risky prime corridor or longer composite public path.

Integration:

- Base floor `MINISTRY`.
- Strong fit for documents, permits, registry morgue adjacency.

### 11. Istinniy Labirint

Candidate id: `istinniy_labirint`.

Identity: true wayfinding horror floor. The floor is not just "maze-looking"; navigation, retreat memory and supplies are the main threat.

Algorithm stack:

- Wilson or Growing Tree maze on a coarse toroidal grid.
- Braiding by danger and reward budget.
- Landmark rooms by depth, betweenness and dead-end value.
- Optional Ariadne-thread marks as chalk, wire, footprints or light residue.

Player decisions:

- Spend chalk, batteries or time to mark a route.
- Follow a long safe wall route.
- Cut through monster-heavy chords.
- Rescue or abandon lost NPCs with explicit quest/event reason.

Integration:

- Best as authored route floor or `archive_warrens`/`fractal_floor` expansion.
- Requires path entropy and landmark debug overlays before implementation.

### 12. Bolnichny Korpus

Candidate id: `bolnichny_korpus`.

Identity: hospital, quarantine and triage block where medicine, infection and permissions shape routes.

Algorithm stack:

- Ward clusters.
- Infection Voronoi cells.
- Locked clean corridors.
- Ventilation graph and cold/warm shells.

Player decisions:

- Steal medicine.
- Forge quarantine clearance.
- Escort infected NPCs.
- Choose who gets treatment and which ward is sealed.

Integration:

- Grows naturally from hospital/quarantine POIs, `slime_nii`, `zombie_apocalypse` and medical loot.
- No infection population refill; infected actors need explicit caps/reasons.

### 13. Spetspriemnik

Candidate id: `spetspriemnik`.

Identity: detention and liquidator control floor with hostage economy, barred sightlines and permit gates.

Algorithm stack:

- Cellblock BSP.
- Guard-loop graph.
- Barred LOS fields.
- Key/permit min-cut gates.

Player decisions:

- Release prisoners.
- Trade names.
- Bribe guards.
- Trigger riot.
- Use cells as shelter or trap.

Integration:

- Strong Ministry/liquidator route candidate.
- Keep stealth/social/combat paths all reachable; no one locked checkpoint owns the floor.

### 14. Shahta Atrium

Candidate id: `shahta_atrium`.

Identity: internal vertical void expressed in 2D: bridges, abyss fields, lift ribs and exposed crossings.

Algorithm stack:

- Concentric rings.
- Sparse bridge graph.
- Abyss/cover fields.
- Long LOS scoring and lift-spoke graph.

Player decisions:

- Cross exposed bridge.
- Take low-cover service rim.
- Repair or drop a bridge.
- Push pursuit into abyss lanes.

Integration:

- Related to roof, antenna and dark metro but distinct: open-depth crossing, not another room maze.
- Needs explicit cover metrics and bridge reachability checks.

### 15. Oranzhereya Betona

Candidate id: `oranzhereya_betona`.

Identity: concrete greenhouse: food, water, spores and civil scarcity made visible as territory.

Algorithm stack:

- Irrigation graph.
- Growth cellular fields.
- Greenhouse room grammar.
- Nutrient basins and faction garden plots.

Player decisions:

- Harvest food.
- Poison or save a crop.
- Burn infestation.
- Reroute water.
- Defend or rob growers.

Integration:

- Ties Living scarcity, `mushroom_mycelium`, black market and water systems.
- Growth is generation-time or local bounded anomaly only.

### 16. Obschezhitie Smeny

Candidate id: `obschezhitie_smeny`.

Identity: shift dormitory: sleeping population, theft, rumors and shelter pressure.

Algorithm stack:

- Dormitory slabs.
- Bunk-room grids.
- Night patrol loops.
- Sound/hearing fields.

Player decisions:

- Loot quietly.
- Wake witnesses.
- Hide during samosbor.
- Protect or rob a sleeping group.

Integration:

- Uses A-Life identities when ordinary people matter; no generator-side identity creation after materialization.
- Strong for life-sim horror where NPCs are not only combat actors.

### 17. Moebius Podezd

Candidate id: `moebius_podezd`.

Identity: residential non-orientable loop. The same entrance becomes wrong after a parity flip.

Algorithm stack:

- Strip graph with orientation/parity flips.
- Paired seam gates.
- Mirrored room labels and reversed patrol routes.

Player decisions:

- Choose the "same" corridor after orientation changes.
- Break seam locks.
- Use mirror tells.
- Exploit reversed patrol routes.

Integration:

- Related to `mirror_run`, `teleport_cells` and communal floors.
- Must be readable through doors, labels and landmarks, not hidden coordinate tricks.

### 18. Cantor Pustoty

Candidate id: `cantor_pustoty`.

Identity: recursive concrete gaps and shrinking safe islands.

Algorithm stack:

- Cantor/Sierpinski-style recursive removal.
- Largest-component extraction.
- Bridge repair and stash island tagging.

Player decisions:

- Carry planks/tools.
- Choose long connected path or risky bridge.
- Hide loot on dust islands.

Integration:

- Related to `fractal_floor`, Void and archive gaps.
- Largest component must include route anchors, or bridges are inserted with explicit metadata.

### 19. Sandpile Perekrytie

Candidate id: `sandpile_perekrytie`.

Identity: critical instability slab. The player can trigger controlled collapse rather than only suffer hazards.

Algorithm stack:

- Abelian sandpile on coarse cells.
- Topple thresholds.
- Unstable wall/floor tags.
- Bounded local collapse triggers.

Player decisions:

- Trigger collapse to open a shortcut.
- Avoid closing retreat.
- Lure monsters into falling slab.
- Stabilize shelter.

Integration:

- Related to samosbor, `section_shift` and `conway_life`.
- Runtime mutation must be local, dirty-flagged and route-safe.

### 20. Attractor Dvor

Candidate id: `attractor_dvor`.

Identity: flow-driven service/transit yard where movement corridors follow strange-attractor streamlines.

Algorithm stack:

- Lorenz/Rossler-like projected streamlines.
- Limit-cycle patrol routes.
- Tensor spines.
- Local switch parameters.

Player decisions:

- Ride the flow corridor.
- Flip a parameter switch.
- Cut across chaotic dead zones.
- Predict patrol loops.

Integration:

- Related to `service_spines`, `rail_trains` and Hyperbolic Switchyard.
- Precompute flow fields; switches mutate local corridors or doors only.

### 21. Spectral Chasovnya

Candidate id: `spectral_chasovnya`.

Identity: sound, cult and hearing geometry. Rooms are organized by acoustic standing-wave bands.

Algorithm stack:

- Graph Laplacian/eigenmode bands.
- Standing-wave rooms.
- Acoustic shadow zones.
- Bell or radio control nodes.

Player decisions:

- Fire loudly to reveal or move threats.
- Move silently through nodes.
- Ring bells to move NPCs.
- Avoid sound-focusing monsters.

Integration:

- Related to noise, cult/Hell and `radio_chess`.
- Runtime sound effects must be bounded by local arenas or event pulses.

### 22. Cayley Byuro

Candidate id: `cayley_byuro`.

Identity: bureaucracy as group theory. Permit transformations are doors; offices are cosets; shortcuts are quotients.

Algorithm stack:

- Cayley graph of permit transformations.
- Generator doors.
- Coset office clusters.
- Quotient shortcut graph.

Player decisions:

- Apply forms in different orders.
- Bribe for one generator.
- Take illegal quotient shortcut.
- Expose forged identity.

Integration:

- Related to Ministry, `number_registry`, permits and forged documents.
- Needs UI/text cues, but the spatial puzzle remains graph-based and deterministic.

## Evolutionary And Heuristic Toolkit

All of this must be deterministic from seed and bounded. Work on graph/proxy state first; stamp the accepted result once.

### Seeded Multi-Start Layout Search

Use:

- `living_blocks`
- `apartment_pressure`
- `communal_knots`
- `archive_warrens`
- `admin_pockets`
- `workshops`

Objective:

```txt
score =
  room_type_coverage
+ zone_spread
+ loop_bonus
+ reachable_area
+ loot_room_coverage
- corridor_length_cost
- dead_end_cost
- cluster_penalty
- protected_touch_penalty
```

Hard rejects:

- overlap
- `aptMask`/lift/hermowall collision
- no spawn room
- no usable up/down lift path after repair

Bound:

- Generate 8-24 graph candidates from the same seed.
- Score rectangles and graph proxies first.
- Stamp only the best candidate.

### Simulated Annealing Room Packer

Use:

- `archive_warrens`
- `admin_pockets`
- `collectors`
- `workshops`
- `sump_causeways`

State:

- room rectangles
- room type
- intended zone band

Moves:

- move room
- resize room
- swap type
- rotate corridor room
- add/remove one room within budget

Energy:

```txt
E =
  overlap * 10000
+ protected_hits * 10000
+ off_band * 80
+ missing_type * 50
+ corridor_cost * 0.04
+ edge_clump * 10
- adjacency_reward
- spread_reward
- anchor_reward
```

Bound:

- 200-600 moves or small generation deadline.
- Coarse occupancy/AABB only.
- Keep best valid state.

### Genetic Corridor Skeletons

Use:

- `service_spines`
- `attic_weatherworks`
- `sump_causeways`
- `dark_metro`
- `production_belt`
- future road/transit floors

Genome:

- ordered trunk nodes
- branch count
- branch width
- room cluster seeds
- loop toggles
- water/rail/service band parameters

Fitness:

```txt
validity
+ edge_coverage
+ loop_count
+ path_length_diversity
+ poi_slots
+ route_identity_tags
- overcarve
- protected_hits
- isolated_islands
```

Bound:

- Population 8-12.
- 4-6 generations.
- Evaluate on 64x64 or 128x128 proxy grid.
- Stamp final skeleton once.

### MAP-Elites Layout Diversity

Use: all procedural route floors, especially the 75 interstitial stops.

Descriptors:

- open area percent
- loopiness
- axiality
- average room size
- corridor/room ratio
- water/fog percent
- spawn-to-lift distance band
- faction-zone spread

Bound:

- 4x4x4-ish descriptor grid.
- 64 candidates max or deadline.
- Select elite matching `geometryId`, `danger`, `majorityId`, `anomalyId`.

Validation:

- Descriptor distribution snapshot tests.
- Deterministic bin choice per seed.
- No P0 reachability regression.

### Min-Conflicts Placement Repair

Use:

- lifts
- route cues
- emergency panels
- anomaly controls
- deep stashes
- required POI entrances

Variables: limited candidate cells from `buildWalkablePlacementMap()`, not the full world.

Constraints:

- one reachable up lift when expected
- one reachable down lift when expected
- every required POI has reachable adjacent floor
- minimum/maximum distance from spawn
- max bucket density
- no protected cells
- no duplicate cells

Objective:

```txt
minimize carve_cost + distance_error + bucket_overflow + room_mismatch + zone_mismatch
```

Bound:

- 32-64 candidate cells per object.
- 1000-2000 greedy/backtracking steps.
- Fail with visible constraint name in tests/debug output.

### Local Search For Decision Triangles

Use:

- loot and monster pressure around POIs
- toll gates
- shelter routes
- anomaly controls
- quest NPC placement

Decision triangle:

- one risk point
- one reward point
- one escape/return point

Scoring:

```txt
score =
  room_match
+ zone_match
+ distance_band
+ visibility_cue
+ exit_separation
- cluster_penalty
- spawn_camping_penalty
- protected_penalty
```

Bound:

- sample 100-300 reachable candidates.
- greedy max-min spacing.
- respect 32x32 bucket caps.

## Generator Integration Sequence

New geometry algorithms should enter through the current procedural route contract, not through new `FloorLevel` values.

Implementation order:

1. Add or reuse a stable `FloorGeometryId` and definition in `src/data/procedural_floors.ts`.
2. Prototype the algorithm on a coarse proxy graph/grid first, using `spec.seed`, `spec.z`, `geometryId`, `majorityId`, `anomalyId` and danger only.
3. Stamp the accepted result into `World` once: `cells`, `roomMap`, textures, features, doors, rooms and lift access.
4. Run generic repair and audit after stamping, then let zones, placement, loot, population and anomalies consume the final geometry.
5. If topology changes after `buildWalkablePlacementMap()`, rebuild placement data or avoid using stale candidates.
6. Keep `generateProceduralFloor()` as the pipeline owner. If many algorithms arrive, prefer a small geometry-profile dispatcher analogous to procedural anomaly modules, but keep route-specific logic out of `main.ts`, `core/` and `render/`.

Current procedural order to preserve:

```txt
base rooms
-> geometry branches
-> zones / water / lifts
-> placement map
-> panels / loot / population
-> anomaly generation
-> final connectivity / container repair
-> NPC removal for NPC-free z
-> lighting
```

## Proxy Grids And Rasterization

Use proxy grids to keep expensive algorithms bounded.

- 16x16 or 32x32: WFC tiles, macro room roles, route descriptors.
- 64x64 or 128x128: graph search, Potts domains, path entropy, MAP-Elites descriptors.
- 128x128 or 256x256: tensor fields, erosion, reaction diffusion, smog/fog source fields.
- Full 1024x1024 scans are acceptable at generation time when capped and few, but not per candidate in multi-start search.
- Proxy coordinates must rasterize through toroidal helpers: `world.wrap`, `world.idx`, `world.delta`, `world.dist2`.
- Store proxy arrays locally during generation. Do not put proxy grids in save payloads unless they become persistent gameplay state.

A good algorithm output is not "a grid". It is a small intent graph: anchors, corridors, protected masks, room roles, density anchors, route cue candidates and validation descriptors. Stamp only the winning intent.

## Caches, Dirty Flags And Sparse Runtime State

Runtime caches must be disposable and rebuildable from the current `World`, `GameState`, room tags, sparse maps or spec.

- Prefer `WeakMap<World, Cache>` or `WeakMap<GameState, Cache>` for runtime anomaly caches.
- `WeakMap<World>` alone is not enough when an existing `World` object is replaced in place; include version fields or a room/spec signature when the cache depends on mutable cells, rooms, fog, features or textures.
- `World` has `cellVersion`, `surfaceVersion`, `wallTexVersion`, `floorTexVersion`, `featureVersion` and `fogVersion`.
- Runtime cell solidity changes must call `markCellsDirty()`.
- Runtime wall/floor texture changes must call `markWallTexDirty()` / `markFloorTexDirty()`.
- Runtime feature changes should use `setFeatureAt()` or call `markFeaturesDirty()` and maintain screen/slide lists.
- Runtime fog changes must call `markFogDirty()`.
- Container moves/removals must rebuild `containerMap`.
- Door edits should use existing door helpers or be followed by `sanitizeDoors()`.

Generation-time direct writes before the world is returned are usually safe, but any mutation after placement-map construction, after handoff to runtime, or inside anomaly ticks must obey dirty/cache rules.

## Save Shape And Route Memory Cautions

Procedural route memory is spec-driven. Do not save derived geometry.

- `FloorGeometryId` and `FloorAnomalyId` are save-bearing through saved procedural specs.
- Renaming or removing an id can make current-version saves normalize that spec back to fallback geometry.
- New ids should be lowercase snake case and stable before release.
- If persistent geometry/runtime state is truly needed, add a bounded save section, sanitize it, cap arrays, bump `SAVE_SHAPE_VERSION`, and reject stale saves. Do not add migration scaffolding unless explicitly required.
- Keep route state keyed by run seed, z, procedural key and visited floor keys. Do not add algorithm-private state to `visited` or route labels.
- Existing 75 procedural z slots, authored design z stops and story anchors must remain compatible with `resolveFloorRunRoute()` and `floorRunStateForSave()`.

## Generation-Time Budgets

Budgets should be enforced as relative and bounded work, not as hidden infinite retries.

- Multi-start candidates: cap candidate count before stamping, usually 8-32.
- Local search: score on proxy data, then stamp once.
- Avoid full `W * W` scans inside candidate loops.
- Prefer typed arrays over object-per-cell structures.
- Reuse one placement field where possible; `createPlacementField()` already scans the full world and smooths.
- Tests already collect generator timings through `timeFloorGeneration()`. New algorithms should not dominate the slowest-generator list or multiply `test:generation` time without an explicit reason.
- Any runtime effect must have a cadence, radius, arena, sparse map, ring buffer or fixed cap. Geometry itself should remain generation-time.

## Geometry Quality Gates

These gates should become tests/debug overlays before large geometry expansion.

### Reachability

- `reachableWalkable / totalWalkable >= 0.98` for normal connected profiles.
- Every non-sealed room should have at least one reachable owned cell.
- Every expected lift direction needs at least one reachable adjacent access cell.
- Every gameplay POI container, panel, NPC or route cue target must be reachable or explicitly marked as key/hermetic/gated.

### Loops

- Build a coarse passable graph or room/corridor skeleton.
- `singleExitRegionCells <= 25%` of reachable cells unless tagged as vault, shelter or trap.
- Social/industrial floors need at least `max(3, rooms / 16)` independent loops.
- Maze/archive profiles may lower this, but both lifts cannot hang behind the same ordinary choke.

### Chokepoints

- Sample doors/corridor cells as articulations.
- Temporarily remove sampled cut cells and measure isolated reachable cells.
- Fail if one ordinary cell/door cuts off both lifts, spawn or more than 25% of reachable space.
- Locked/hermetic cuts are allowed only with a non-gated route path.

### Line Of Sight

- Sample 8-direction ray lengths from spawn, lifts, POIs and 256 random reachable cells.
- Indoor target: `p95 <= 96`, `p99 <= 192`.
- Spawn/lift access should not expose the player to monster-heavy sightlines longer than 48 cells without cover.
- Open/roof floors must declare exceptions.

### Path Entropy

- Sample 128 reachable cells.
- Compare shortest paths to spawn, up lift, down lift and nearest shelter.
- Detour factor `pathLength / toroidalManhattan` should usually be `1.1..4.5`.
- `>8` flags over-maze; `<1.05` flags flat/open.
- Near-shortest first-step entropy should not collapse to one corridor across the whole floor.

### Density Gradients

- Keep existing bucket caps from placement profiles.
- Add `max 3x3 bucket cluster <= 15%` of actor budget unless a named crowd arena declares it.
- Monster count within 32 cells of spawn should be `<= max(16, 2% of monsters)`.
- High-density anchors must make gradients, not piles.

### Escape And Samosbor Safety

- From 128 sampled cells, `p90` distance to nearest lift/shelter should be `<= 350` passable steps unless the profile is deliberate endgame pressure.
- After local samosbor patch, rerun spawn/lift/POI reachability.
- Assert protected `aptMask` and `hermoWall` cells are unchanged unless a local, explicit contract says otherwise.

### Torus Seam

- Sample seam cells at `x=0/W-1` and `y=0/W-1`.
- Passable wrap neighbors must be graph-connected.
- Wrapped metadata must stay coherent: `roomMap`, textures, features, doors and lift access.

### POI Protection

- Geometry/anomaly passes must not erase apartment masks, hermetic walls, protected interiors, lift cells, route buttons or container cells.
- Deliberate protected-room opening may clear only the access cell and must keep room ownership coherent.

### Test Matrix Shape

- One fast forced-spec smoke per new geometry with `anomalyId: 'none'`.
- One stress case with a topology anomaly if the geometry can combine with `teleport_cells`, `rail_trains`, `conway_life`, `bad_apple_world`, `living_tunnels`, `wall_snake` or `section_shift`.
- Add opt-in generation-matrix cases for sampled seeds and z bands.
- Snapshot descriptor metrics, not full maps: reachable ratio, room count, loop count, worst choke, lift path length, bucket max and generation time.
- Seeded story/design floors should keep stable fingerprints unless the implementation intentionally changes them.

## Debug Views Worth Adding

- Reachability component map: ungated, key-gated, hermetic-gated and unreachable.
- Lift access overlay: lift cell, button/access cell and reachable adjacency.
- Choke heatmap: percent of reachable graph cut by sampled cell/door.
- LOS heatmap: long rays from spawn, lifts and POIs.
- Path tree overlay: spawn/lift/shelter shortest paths and dead ends.
- Density buckets: NPC/monster counts per 32x32 bucket plus cap.
- Samosbor patch overlay: field, regenerated cells, stitched boundary and protected cells.
- Torus seam overlay: wrap edges and passable seam transitions.
- Phase-field overlay: Potts/Ising/reaction-diffusion states before rasterization.
- Decision-triangle overlay: risk, reward, exit and route cue positions.

## Failure Modes To Name Explicitly

- Spawn in solid.
- Lift with no reachable adjacent cell.
- `Cell.DOOR` without `world.doors` record.
- Room record with no walkable owned cell.
- Sealed route through one ordinary choke.
- POI/container/control placed on blocked feature cell.
- Over-dense actor pile in one bucket cluster.
- Monster line of sight into spawn.
- Samosbor patch deleting protected cells.
- Stale route cue after rebuild.
- Non-wrapping distance/path math.
- Route stop implemented as a new `FloorLevel`.
- Runtime search over all 1,048,576 cells.

## Prioritized Implementation Campaign

This is a proposed order for future code work, not work done by this document.

### Phase 1: Measurement Before More Complexity

1. Add geometry metric helpers and debug output for reachability, loops, chokepoints, LOS, path entropy and density buckets.
2. Add sampled tests for existing strong floors: Living, Kvartiry, Manhattan, Hell, procedural matrix.
3. Add a geometry summary artifact in tests/logs, not committed generated files.

Why first: complex algorithms without metrics will create beautiful broken maps.

### Phase 2: Low-Risk Upgrades To Existing Floors

1. Living: weighted connector routing for apartments and hub route scoring.
2. Kvartiry: social macro graph plus Potts domains over existing wall-grid floor.
3. Manhattan: traffic field placement, LOS cover scoring and zone-dual faction fronts.
4. Hell: reaction-diffusion overlay and arena-chain scoring without changing route story.

Why second: these floors already work, and targeted geometry improves visible gameplay.

### Phase 3: Procedural Profile Differentiation

1. Add one macro algorithm per existing `FloorGeometryId`.
2. Add `tensor_spines` or upgrade `service_spines`.
3. Add `drainage_erosion` or upgrade `sump_causeways`.
4. Add Wilson/WFC variants to archive/admin/residential profiles.
5. Add MAP-Elites descriptor sampling for procedural route diversity.

Why third: 75 procedural route stops need stronger shape identity.

### Phase 4: New Authored Math Floors

Best first candidates:

1. `istinniy_labirint`: fills the obvious maze/labyrinth gap and mainly needs generation-time graph work plus landmarks.
2. `hilbert_depot`: strong gameplay decision and mostly generation-time.
3. `voronoi_quarantine` or `bolnichny_korpus`: natural zone/faction/medical integration.
4. `critical_leak_archive` or `cantor_pustoty`: strong percolation/fractal identity with no broad runtime system.
5. `shahta_atrium`: high-risk crossing floor, but needs LOS/cover metrics first.
6. `radon_exchange`: visually and tactically distinct, but needs LOS/cover metrics first.
7. `harmonic_bathhouse` or `sandpile_perekrytie`: excellent interactive math, but runtime mutation must be carefully bounded.

### Phase 5: Runtime-Bounded Anomalies

Only after generation metrics and existing anomaly contracts are strengthened:

1. `cyclic_cellular`: bounded arenas, no topology mutation.
2. `potts_blocks`: mostly generation-time, optional local toggles.
3. `reaction_plaster`: visual/loot/pressure first.
4. `capillary_growth`: static first, moving only if merged into existing systems.

## Do Not Use

- Cell-level SAT/ILP over the full world.
- Full-world genetic stamping for every candidate.
- Runtime annealing during play.
- Imported ML/model/noise dependencies.
- Renderer-side geometry decisions.
- Fallback paths that skip reachability checks.
- New `FloorLevel` values for route stops.
- Per-frame full-world fog, field, path or population scans.
- Dead data with no route, decision, debug path or test target.
