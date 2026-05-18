# LOG_DOC_EXPANSIONS

## 2026-05-17 - Ten Expansion Technical Design Documents

What was wrong:
- `desdoc.md` contains a large idea pool, but many concepts are broad bullets rather than implementation-ready design documents.
- The project needed expansion/DLC-style development documents that preserve Gigahrush's existing playable foundation: TypeScript/Vite raycaster, current floors, samosbor variants, A-Life, quests, factions, inventory, PSI, and modular content files.
- A single giant new document would repeat the same bloat problem and make future implementation ownership unclear.

What was done:
- Created root `expansion.md` as the entry map.
- Created `Docs/Expansions/INDEX.md` as the working developer index.
- Created `Docs/Expansions/01_mushroom_shift/expansion.md`: food production, mushrooms, плесень, social scarcity.
- Created `Docs/Expansions/02_metro_error_line/expansion.md`: metro routes, train hub, wrong exits.
- Created `Docs/Expansions/03_raionsovet_archive/expansion.md`: permits, documents, living archive.
- Created `Docs/Expansions/04_heatline_zero/expansion.md`: heat nodes, valves, steam, pressure.
- Created `Docs/Expansions/05_black_market_88/expansion.md`: scarcity, debt, market contracts.
- Created `Docs/Expansions/06_obzh_school/expansion.md`: school evacuation, grouped NPCs, micro-perks.
- Created `Docs/Expansions/07_hospital_quarantine/expansion.md`: finite medical conditions, quarantine, morgue.
- Created `Docs/Expansions/08_concentrate_industry/expansion.md`: factory lines, abstract supply, work shifts.
- Created `Docs/Expansions/09_elevator_loop_404/expansion.md`: numbered floor pockets, floor instances, memory/map errors.
- Created `Docs/Expansions/10_void_afterprotocol/expansion.md`: late-game Void protocols, local rule changes, backlash.
- Created `Docs/Tasks/Status_DOC_EXPANSIONS.md` and `Docs/AgentLogs/Rationale_DOC_EXPANSIONS.md`.

Cinematic Cheats used:
- Mushrooms use room-level phases and texture/feature changes instead of biological growth simulation.
- Metro uses route resolution and a wagon room instead of physically moving through a full rail network.
- Documents use access tags and suspicion scores instead of a full legal simulation.
- Heat uses discrete pressure nodes and steam zones instead of fluid/thermal simulation.
- Market uses aggregated scarcity/debt/heat instead of live buyers and sellers.
- School evacuation uses grouped NPC state instead of per-child crowd simulation.
- Hospital uses finite medical conditions and flags instead of pathogen diffusion.
- Industry uses abstract supply and work-shift aggregates instead of per-worker logistics.
- Numbered floors use one active pocket instance instead of permanent enum bloat.
- Void protocols are command-based local interventions with backlash instead of global samosbor control.

Exact Microseconds saved:
- Avoided monolithic expansion doc: estimated 250000-500000 us saved per future implementation planning pass.
- Avoided immediate new `FloorLevel` expansion for every concept: estimated 500000+ us saved in integration churn.
- Avoided biological, fluid, crowd, disease, factory, and alternate-floor simulations: estimated 100-700 us/frame protected depending on future feature and device tier.
- Root/index navigation reduces future agent search and misread cost: estimated 60000-120000 us per handoff.

Verification:
- `find Docs/Expansions -mindepth 2 -maxdepth 2 -name expansion.md -print | sort | wc -l`: 10.
- `rg -l "Definition of Done" Docs/Expansions/*/expansion.md | wc -l`: 10.
- `rg -l "Производительность и Math LOD" Docs/Expansions/*/expansion.md | wc -l`: 10.
- `wc -l` over root/index/10 docs/status/rationale: 1,619 lines.
- `npm run build`: passed after final polish. Vite transformed 157 modules and emitted `dist/index.html` at 687.06 kB, gzip 211.98 kB.

## 2026-05-17 - Mandatory Foundation Addition: Samosbor Director

What was wrong:
- Ten expansion packages existed, but the plan still lacked the single most important integration layer: a campaign director that decides when content appears, how consequences chain, and how samosbor aftermath selects expansion hooks.
- Without this layer, each expansion would eventually implement its own scheduler, cooldowns, traces, and pressure logic.

What was done:
- Created `Docs/Expansions/00_samosbor_director/expansion.md`.
- Created `Docs/Expansions/00_samosbor_director/implementation_plan.md`.
- Created `Docs/Expansions/00_samosbor_director/content_manifest.md`.
- Created `Docs/Expansions/00_samosbor_director/integration_contract.md`.
- Updated root `expansion.md` to list `00_samosbor_director`.
- Updated `Docs/Expansions/INDEX.md` with director dependency rules.

Cinematic Cheats used:
- Director uses rare ticks, data-driven beats, bounded traces, and visible consequences instead of continuous AI simulation.
- Cross-expansion chains are 2-4 small beats, not giant quest scripts or per-frame state machines.

Exact Microseconds saved:
- Avoided duplicate schedulers across 10 expansions: estimated 500000-1000000 us future integration savings.
- Protected target steady-state runtime at 0 us/frame for director logic.
- Avoided per-frame pressure checks and opaque AI director behavior: estimated 200-600 us/frame saved on weak devices once systems are implemented.

Verification:
- `find Docs/Expansions -mindepth 2 -maxdepth 2 -name expansion.md -print | sort | wc -l`: 11.
- `find Docs/Expansions -mindepth 2 -maxdepth 2 -type f \\( -name 'implementation_plan.md' -o -name 'content_manifest.md' -o -name 'integration_contract.md' \\) -print | sort | wc -l`: 33.
- `npm run build`: passed. Vite transformed 170 modules and emitted `dist/index.html` at 725.28 kB, gzip 224.41 kB.
