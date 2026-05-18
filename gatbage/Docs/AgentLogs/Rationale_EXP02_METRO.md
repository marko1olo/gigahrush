# Rationale_EXP02_METRO

Date: 2026-05-17  
Scope: documentation planning for Expansion 02: Metro Error Line.

## Decision 1 - Metro As Pocket/Route Layer

Problem: A full metro floor would collide with shared `FloorLevel`, generation, save/load and other agents' domains before the transport loop is proven.

Solution: Treat EXP02 MVP as station pockets plus route state machine. Stations bind to existing floors or opaque `floorInstanceId` hooks. Travel resolves by deterministic route seed and timer, not by physical rail traversal.

Rejected Alternatives: Adding `FloorLevel.METRO` immediately was rejected because root docs forbid permanent floor additions before pocket proof. Simulating tunnel geometry was rejected because it adds pathfinding/rendering cost without improving the core decision: pay, risk, ride, exit.

Scalability potential: Low uses static station pockets and one train room. Middle adds warning/content variants. High lets station availability react to zone/faction events. Ultra spends cycles on fake parallax, flicker and hallucination sprites, not systemic rails.

Hardware Impact: On low-end silicon such as i3/MX350, idle cost remains 0 us and route work happens only on interaction/samosbor events. Expected saving versus continuous rail simulation: roughly 100-500 us per frame avoided in worst naive designs.

## Decision 2 - Wrong Exit With Warnings

Problem: Random teleport-like errors can look like broken navigation and destroy player trust.

Solution: Wrong exits are deterministic from route state and selected before arrival. Every wrong exit has warning ids displayed as tabloid errors, NPC lines, wrong tickets, voice mismatch or repeated passenger. Post-fact event/log records the anomaly.

Rejected Alternatives: Per-frame random chance and hidden dice rolls were rejected. They are hard to debug, hard to explain to players and likely to produce fake bug reports.

Scalability potential: Low shows one warning text. Middle combines two warning channels. High creates rumors from source events. Ultra adds visual fakes in the train window without changing outcome math.

Hardware Impact: Warning selection costs tens of microseconds at departure/arrival, not per frame. Avoids repeated risk polling and reduces debug time because state is reconstructible.

## Decision 3 - Metro NPCs Without Global Faction

Problem: A new metroworker faction in MVP would require relations, patrol rules, faction control and diplomacy outside EXP02 scope.

Solution: Use `occupation/tag: metro` NPC roles for MVP: duty worker, token trader, refugee, wounded liquidator, plain cultist, depot foreman. Faction effects are route modifiers and station conditions, not a new global relationship matrix.

Rejected Alternatives: A full metroworker faction was rejected because it creates dependencies on `relations.ts`, faction AI and other expansion economies before the route loop exists.

Scalability potential: Low has three active NPC roles. Middle adds barter and warning dialogue. High lets factions close routes through event hooks. Ultra adds passenger ambience and silhouette variety only.

Hardware Impact: Active train NPC cap of 3-6 prevents crowd simulation. On i3/MX350 this keeps train hub comparable to a small room; estimated active budget target 0.03-0.08 ms.

## Decision 4 - Event/Debug First Contract

Problem: Metro route bugs are timing, seed and state bugs. Without debug hooks, QA would need long manual walks and still fail to reproduce wrong exits.

Solution: Define debug commands for unlock, spawn, call train, force route, force wrong exit, give token, close station, show risk and dump state. Define metro event ids for station discovery, token, boarding, warning, arrival, wrong exit and closure.

Rejected Alternatives: Manual playtest-only verification was rejected. It produces false confidence and wastes time when route risk depends on samosbor and inventory state.

Scalability potential: Low debug prints state. Middle shows risk breakdown. High links events to rumors/log. Ultra can visualize route telemetry, but the data remains the same.

Hardware Impact: Debug and telemetry are inactive unless requested or on route state change. Runtime idle impact remains 0 us; state-change telemetry target is 1-3 us.

## Decision 5 - Token/Documents As Risk Modifiers

Problem: If tokens are simple keys, metro becomes a binary fast travel unlock. If documents are pure lore, they do not affect play.

Solution: Tokens and documents gate routes and modify risk. A dispatcher note can open service route and lower wrong-exit chance; wet schema reveals warnings; red token helps dangerous return but raises suspicion elsewhere.

Rejected Alternatives: Money-only fare was rejected because it collapses decisions to economy. Random document flavor was rejected because it adds content without mechanical pressure.

Scalability potential: Low has one token and one note. Middle adds stolen passes and barter. High connects documents to archive/black-market hooks. Ultra adds presentation variants while preserving same data.

Hardware Impact: Inventory/document checks run on interaction, not frame update. Expected per-check cost is negligible relative to NPC/pathfinding systems.

## Decision 6 - Shared Dependency Isolation

Problem: EXP02 naturally touches archive documents, black market access, elevator/numbered floors and samosbor. Direct dependencies would make parallel agents block each other.

Solution: Integration contract uses optional hooks and fallback behavior. Missing numbered floor hooks disable or redirect wrong exits to depot. Archive/market interactions remain item/document ids until providers exist.

Rejected Alternatives: Importing future EXP03/EXP05/EXP09 files or assuming their ids exist was rejected as architectural sabotage under parallel-agent constraints.

Scalability potential: Low works with existing floors only. Middle consumes optional access items. High integrates event-driven closures. Ultra adds visual affordances, not hard dependencies.

Hardware Impact: Optional-hook checks occur at route listing/arrival. Missing hooks fail closed with debug-visible reason; no per-frame polling.
