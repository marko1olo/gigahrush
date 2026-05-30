# GIGAHRUSH Plans

Статус: consolidated backlog from active planning docs as of 2026-05-24.

`README.md` remains the source of truth for shipped behavior. This file is only for plans that are not fully proven in game yet, or are implemented as a thin slice but still have documented expansion debt. Historical prompts and old batch plans live under `gatbage/`.

Project-bible terms such as honest current-floor simulation, player-as-controlled-entity, non-player-spawn-bubble AI and off-floor bounded macro-life are source-of-truth contracts in `README.md` and `architecture.md`; this backlog should not redefine them.

## Already Landed Enough To Treat As Source Facts

These are no longer pure plans; update `README.md` instead when their behavior changes:

- 6 story `FloorLevel` floors and the `z=-50..+50` `FloorRun`.
- 20 routed authored design floors and 75 procedural/fallback interstitial floors.
- 19 procedural anomaly ids in data/generation/runtime surface, including rail trains, Bad Apple, zombie apocalypse, Conway, section shift and samosbor seed.
- 8 numbered lift instance definitions with runtime interruption state.
- Runtime floor memory for visited route stops: ordinary lift travel restores the stored `World`/entities for the exact floor key, and browser saves include bounded packed floor-memory entries when they fit the save budget. First visits, evicted snapshots and missing save entries regenerate from route seed/data. Samosbor changes the active world and the stitched result becomes the next stored state for that same key.
- Net Sphere optional Cloudflare/D1 terminal and Net Terminal Gen current-floor editor.
- High-density active AI profiles, entity index broadphase and pathfinding budget.
- Save shape versioning with current-shape rejection of stale saves.

## P0 Playability Plans

These are the main unfinished design debts from `desdoc.md`:

| Plan | Current state | Remaining proof |
| --- | --- | --- |
| One complete expedition slice | Debug command ids and route helpers exist. | Prove a normal player-readable route: Living prep -> assignment/rumor -> lift -> fight/steal/repair -> container/reward -> samosbor warning -> return consequence. |
| Combat readability | Weapon/PSI data, damage records, HUD, particles, audio and monster counterplay data exist. | Make ammo/cooldown/weapon roles and projectile/impact causes readable without reading tables. |
| Route legibility | `FloorRun`, route cues, maps, design-floor teleports, procedural specs, optional title seed and runtime floor memory exist. | Show route seed/id, danger, target reason and return path consistently in lift/map/quest/log language. |
| Samosbor as expedition drama | Variants, modifiers, director beats, local Living wave and aftermath events exist. | Tie warning, shelter, active phase and aftermath to visible route changes, residue, rumors, containers or contracts. |
| Consequences that stick | Events, room memory, NPC memory, rumors, containers, faction events, economy and production exist. | Make stealing, reporting, repairing, trading and sheltering leave more visible aftereffects. |
| A-Life macro consistency | Million/fallback pool, active-floor materialization, death foldback, caravan/economy/contract macro and no ordinary refill exist; save currently stores up to `65_536` dead A-Life ids. | Move explicit migrants by changing persistent `floorKey`, bind generated quest givers to stable `persistentNpcId`, and choose a save strategy for full-million depopulation before promising it as shipped. |

## Expansion Backlog

The expansion packets under `Docs/Expansions/**` are planning/reference documents. Many MVP pieces have landed as content modules or generic systems, but the full expansion fantasies are not all done.

| Expansion | Source docs | Current code reality | Unfinished plan |
| --- | --- | --- | --- |
| `00_samosbor_director` | `Docs/Expansions/00_samosbor_director/` | Generic director data/system exists with 34 beats. | Campaign act gates, cross-expansion adapters, richer black-box traces and cause chains. |
| `01_mushroom_shift` | `Docs/Expansions/01_mushroom_shift/` | Mushroom cellar, carnivorous fungus and related content exist. | True farm loop: strains, substrate/water, grow/harvest state, social/economy reaction and optional hydroponics pocket. |
| `02_metro_error_line` | `Docs/Expansions/02_metro_error_line/` | `dark_metro`, rail trains and Maintenance metro content exist. | Wrong-exit chains, station network offers, director hooks and route memory consequences. |
| `03_raionsovet_archive` | `Docs/Expansions/03_raionsovet_archive/` | Raionsovet route floor, permits and document systems exist. | Stronger access graph, forged-document consequences and cross-route document requirements. |
| `04_heatline_zero` | `Docs/Expansions/04_heatline_zero/` | Heatline Zero POI/system exists. | Multi-node heat network, director adapters and links into hospital, school and production routes. |
| `05_black_market_88` | `Docs/Expansions/05_black_market_88/` | Market 88 route/content, contracts, banking and economy hooks exist. | Deeper debt pressure, raids, witness/reputation consequences and production-fed market scarcity. |
| `06_obzh_school` | `Docs/Expansions/06_obzh_school/` | ОБЖ school content exists. | Evacuation group system, micro-perks, drills and school-local samosbor aftermath. |
| `07_hospital_quarantine` | `Docs/Expansions/07_hospital_quarantine/` | Hospital quarantine block/content exists. | Finite medical conditions, quarantine cards, morgue/records consequences and treatment routes. |
| `08_concentrate_industry` | `Docs/Expansions/08_concentrate_industry/` | Production, factories, recipes and concentrate POIs exist. | Work shifts, defects, sabotage, guarded output routes and market dependency loops. |
| `09_elevator_loop_404` | `Docs/Expansions/09_elevator_loop_404/` | Numbered lift instance state exists for 8 definitions. | Unique pocket generation, memory/rumor loops and per-number playable consequences. |
| `10_void_afterprotocol` | `Docs/Expansions/10_void_afterprotocol/` | VOID protocols and late-floor hooks exist. | Post-final local rule changes, backlash chains and late-game protocol targets tied to earlier systems. |
| `11_net_terminal_gen_map_editor` | `Docs/Expansions/11_net_terminal_gen_map_editor/` | Current-floor editor, terminal access and patch replay exist. | Better editor UX, validation affordances and clearer player-facing distinction between diegetic debug and shipped game loop. |

## Procedural Anomaly Backlog

`anomalies.md` is now partly stale as an implementation-order document because all 19 anomaly ids are represented in the current procedural deck. Keep it as a design/counterplay reference. Remaining work belongs in focused source tasks:

- More readable counterplay for heavy topology anomalies: `wall_snake`, `conway_life`, `section_shift`.
- More NPC/faction use of anomaly facts, not only player hazards.
- More focused tests for reachability, save/load and route cues on moving/topology anomalies.
- Artifact-size discipline for generated frame data and any future media-heavy anomaly.

## Documentation Hygiene

- Keep `README.md` factual and update it only after code behavior is verified.
- Keep `architecture.md` for layer contracts and integration rules, not feature wishlists.
- Keep `desdoc.md` as a short design-pressure document; large new plan batches should be summarized here and archived under `gatbage/`.
- Do not recreate root `MACRO2_*.md` queues unless the user explicitly asks for a new orchestration batch.
