# Rationale_DOC_EXPANSIONS

## Decision 1: Separate DLC-Style Documents Under `Docs/Expansions`

Problem: The request asks for 10 different `expansion.md` documents, while a single root file named `expansion.md` would either become another monolith or force ten incompatible concepts into one page.

Solution: Create ten expansion folders under `Docs/Expansions/`, each with its own `expansion.md`, plus an index for navigation. Each file is a self-contained technical design document for one update-sized content slice.

Rejected Alternatives: A single `expansion.md` was rejected because it would reproduce the current `desdoc.md` problem: too much scope in one document and weak implementation ownership. Random top-level files were rejected because they would make the repo harder to navigate.

Scalability potential: Weak devices can ship a small MVP slice per expansion; middle/high/ultra tiers can enable richer density, visual overkill, and larger simulation radii without changing the document model.

Hardware Impact: Documentation-only change has 0 us frame cost. The design pattern protects roughly 100-300 us/frame on low-end i3/MX350-class hardware by steering future implementation toward slow ticks and cheap visual fakes.

## Decision 2: Treat Expansions As Development Blueprints, Not Marketing DLC Notes

Problem: The source `desdoc.md` already contains many ideas, but many are bullet pools. The user explicitly requested coherent and meaningful technical design documents, not more bullet lists.

Solution: Each expansion uses a consistent design-document shape: intent, release fantasy, player loop, world/floor scope, systems, content plan, AI/faction consequences, samosbor behavior, data/code ownership, performance LOD, milestones, and rejection criteria.

Rejected Alternatives: Writing pitch summaries was rejected because it would not guide implementation. Writing only tables was rejected because it would not explain system coupling or player-facing consequences.

Scalability potential: Documents can become batch prompts or implementation epics later without being rewritten from scratch.

Hardware Impact: No runtime cost. Future savings come from explicit low/middle/high/ultra paths and avoiding all-at-once simulation.

## Decision 3: Start With Production Food And Transport

Problem: The roadmap contains many strong concepts, but a coherent expansion line needs dependencies that make sense. Starting with late-game lore first would not help the working survival loop.

Solution: Expansion 01 covers food production through mushrooms because it touches hunger, economy, A-Life, samosbor mutations, and social pressure. Expansion 02 covers metro routes because it gives a controlled bridge between existing floors and later numbered-floor content.

Rejected Alternatives: Starting with pure bosses or meme floors was rejected because it would add spectacle without deepening the current playable foundation. Adding a full `HYDROPONICS` or `METRO` `FloorLevel` immediately was rejected; both docs define MVP slices that work through existing floors first.

Scalability potential: Low-end builds can run one room-level farm and three station nodes; high/ultra builds can add dense visual variants, faction pressure, and richer route tables without changing the core architecture.

Hardware Impact: Planned cost stays near 0 us/frame outside rare ticks. Slow room-level mushroom ticks and route resolution at departure avoid per-frame simulation, protecting roughly 100-250 us/frame versus naive live growth and moving train simulation.

## Decision 4: Extend Existing Ministry And Maintenance Before Adding New Floors

Problem: `desdoc.md` names ADMIN and HEAT as future floors, but existing project reality already has `MINISTRY` and `MAINTENANCE`. Adding new floor requirements in a planning doc too early would create integration pressure and enum churn.

Solution: Expansion 03 expands `MINISTRY` with document, permit, archive, and queue systems. Expansion 04 expands `MAINTENANCE` with discrete heat nodes and valves. Both can later graduate into floor instances if the MVP proves valuable.

Rejected Alternatives: A new `FloorLevel.ADMIN` was rejected because existing agent prompts explicitly caution against it in this branch. Real-time heat/fluid simulation was rejected because gameplay needs readable state, not physical accuracy.

Scalability potential: Low-end builds get a few rooms and interaction checks; high/ultra builds can add DATA archive visuals, richer queues, steam overlays, and more linked nodes.

Hardware Impact: Planned runtime cost remains interaction-bound or rare-tick. Discrete heat nodes and document access tags avoid broad scans, saving roughly 100-300 us/frame compared with naive per-cell heat or global legal-state simulation.

## Decision 5: Put Economy And Training Behind Consequence Systems

Problem: A market can degenerate into a price list, and a school can degenerate into a tutorial. Both would add content volume without strengthening Gigahrush as survival horror.

Solution: Expansion 05 makes the black market a consequence layer with trust, heat, debt, contracts, and scarcity. Expansion 06 makes school content a mid-game evacuation and responsibility system with grouped NPC state, not beginner instruction.

Rejected Alternatives: A static shop inventory was rejected because it would not connect production, documents, routes, and faction pressure. A pure tutorial school was rejected because the existing game already has onboarding through Olga, Barney, and Yakov.

Scalability potential: Low-end can run one hidden market and one evacuation group. High/ultra can add dense NPC scenes, richer contracts, more school aftermath, and visual clutter while preserving aggregated logic.

Hardware Impact: Debt/scarcity updates are event-bound; evacuation uses group states. This avoids per-NPC crowd simulation and live buyer simulation, saving roughly 200-500 us/frame during crowded scenes on weak hardware.

## Decision 6: Keep Medicine And Industry Finite-State

Problem: Hospital and factory content can easily become expensive simulations: infection spread, body systems, production chains, worker AI, item generation, and live logistics.

Solution: Expansion 07 uses a small finite list of medical conditions and quarantine flags. Expansion 08 uses factory definitions, abstract supply, and aggregated work-shift state. Both expose consequences without simulating every cell, worker, or pathogen.

Rejected Alternatives: A realistic disease model was rejected because it would punish the player with opaque state and burn CPU. Full factory logistics were rejected because the first playable slice only needs one line, one failure, one output, and one moral choice.

Scalability potential: Low-end builds run conditions only on the player/key NPCs and one factory line. High/ultra builds can add richer visuals, more condition definitions, additional lines, and faction raids while keeping the same finite-state model.

Hardware Impact: Planned systems are rare-tick or interaction-bound. Avoiding pathogen diffusion and per-worker factory AI protects roughly 300-700 us/frame in heavy scenes on weak hardware.

## Decision 7: Handle Numbered Floors As Pockets And Void As Local Rules

Problem: The roadmap wants many numbered floors and postfinal VOID content, but implementing them as permanent floors or full cosmology would bloat architecture and damage tone.

Solution: Expansion 09 defines numbered floors as temporary `NumberedFloorDef`/floor instances with one local rule each. Expansion 10 defines Void protocols as late-game local interventions with backlash, not global control over samosbor.

Rejected Alternatives: Adding 1000 enum values or full persistent simulation was rejected as architectural bloat. Explaining the origin of samosbor was rejected because the setting works better when the player receives procedures, not truth.

Scalability potential: Low-end builds run one active pocket and a few protocol defs. High/ultra builds can add richer visual identity and more connected consequences without changing the finite-instance model.

Hardware Impact: One active pocket and command-based protocols keep runtime near zero outside transitions/interactions. This avoids broad world rewrites and protects roughly 200-600 us/frame compared with persistent alternate-floor simulation.

## Decision 8: Add The Director Before More Content

Problem: Ten expansion packages are strong individually, but without shared pacing they can become disconnected modules with separate cooldowns, separate event logic, and duplicated consequence handling.

Solution: Add `00_samosbor_director` as a mandatory foundation expansion. It defines a cheap campaign director: act gates, director beats, cross-expansion chains, danger/relief budgets, and 300-entry black-box trace.

Rejected Alternatives: Adding another content biome was rejected because the current bottleneck is cohesion, not idea count. A heavy AI director was rejected because Gigahrush needs predictable data-driven pressure, not opaque procedural control.

Scalability potential: Low-end builds run rare director ticks and 20 beats. High/ultra builds add more beat text, richer aftermath and visual presentation without changing runtime cost model.

Hardware Impact: Target steady-state is 0 us/frame. Rare-tick evaluation protects roughly 200-600 us/frame compared with each expansion adding its own scheduler or per-frame pressure checks.
