# AG10 Economy / Contracts / Containers Rationale

## Preflight

Problem: Task requires economy, production, contracts, containers, and debug without breaking active work from other agents.
Solution: Read prompt block by CLI, required README/desdoc/code files, and baseline build before editing. Use existing `World`, `Quest`, `Item`, debug overlay, and event types. Keep systems cooldowned and data-driven.
Rejected Alternatives: New `EntityType.CONTAINER`, rewritten trade UI, or replacing quests would expand blast radius and violate prompt scope.
Scalability potential: Low uses static containers and debug prices; Middle adds slow production ticks; High adds access/theft and contracts; Ultra can simulate richer balance only through explicit debug/offline ticks.
Hardware Impact: Runtime target is zero per-frame scan. Container lookup is O(1) by cell; economy and production run on demand or 30-120 game-second cadence. Estimated frame gain versus naive full-world container scans on i3/MX350: avoids >1000 us/frame worst-case; expected steady cost 0 us/frame outside explicit ticks.

Problem: Mandate registry and domain file referenced by top-level instructions are not present in this checkout.
Solution: Record absence in status and use extracted XML selected mandates plus `desdoc.md` economy/container/contract sections as binding local evidence.
Rejected Alternatives: Fabricating registry mandate names or editing outside scope.
Scalability potential: Documentation-driven scope remains enforceable without phantom dependencies.
Hardware Impact: No runtime impact.

## Loop 1 Data/Storage/Slow Systems

Problem: Economy requires scarcity and production without per-frame market simulation.
Solution: Added abstract `ResourceDef` stocks and explicit `ensureEconomyState()` accessors. Prices derive from scarcity only when queried. Production registers a bounded subset of factory rooms and advances by `nextTickAt` gates.
Rejected Alternatives: Simulating every room every frame or modeling physical logistics; both violate frame-time limits and add dependencies on unfinished A-Life inventory.
Scalability potential: Low can show static scarcity prices; Middle runs slow production; High uses access/theft and contracts around stock shortages; Ultra can run forced debug/balance simulations without touching frame loop.
Hardware Impact: Expected steady-frame cost is 0 us. Forced production tick is bounded by registered rooms, estimated 50-250 us on i3/MX350 for the current cap.

Problem: Containers need ownership and lookup but must not alter the entity pipeline.
Solution: Added `World.containers` plus `containerMap` keyed by cell index, seeded lazily by room type, with existing `Item` stacks.
Rejected Alternatives: New `EntityType.CONTAINER`, sprite/physics registration, or modifying renderer entity batches.
Scalability potential: Low static room containers; Middle production output containers; High theft/access and owner/faction behavior; Ultra adds richer audit/reputation on the same storage.
Hardware Impact: Nearby lookup checks only a radius around the player on interaction/debug. Avoided full scan saves roughly 500-1500 us/frame versus naive 1000-container scans on low-end silicon.

## Loop 2 Transfers/Access/Contracts

Problem: Container transfer must respect current inventory semantics and avoid a second stack implementation.
Solution: `takeFromContainer()` calls `addItem()`, `putIntoContainer()` calls `removeItem()`, and capacity checks are slot-based.
Rejected Alternatives: Directly mutating player inventory with custom stack code or adding container-specific item types.
Scalability potential: Low supports debug inspection; Middle supports production output; High adds theft and access; Ultra can add audits/reputation on existing stolen markers.
Hardware Impact: Transfers are explicit player/debug actions, estimated 20-100 us per use, 0 us/frame.

Problem: Contracts need to be visible as gameplay but must not replace story/side quests.
Solution: Added 12 `ContractDef` records and conversion into existing `Quest` objects with `contractId` metadata. Active contract spawning respects the existing active quest limit.
Rejected Alternatives: Separate contract runtime, separate completion checker, or bypassing `MAX_ACTIVE_QUESTS`.
Scalability potential: Low debug-spawned contracts; Middle floor/faction filtered contracts; High shortage/theft-generated contracts; Ultra batch balance simulation via debug.
Hardware Impact: Contract spawn/list is linear over 12 rows, below measurable frame cost and only invoked by debug/interaction.

## Loop 3 Integration/Debug/Save

Problem: Data-only systems do not meet done criteria; debug must expose containers, production, prices, contracts, and balance counts.
Solution: Extended existing debug command path with explicit commands for price summary, nearby container listing, container take, forced production tick, contract spawn/list, and population/item counts.
Rejected Alternatives: New debug UI framework or container trade panel. Existing debug overlay was enough and kept the blast radius small.
Scalability potential: Low exposes static state; Middle forces/verifies production; High validates theft/contracts; Ultra can add longer debug simulations using the same command surface.
Hardware Impact: Debug commands run only on key press. Steady-frame cost remains 0 us for debug inspection.

Problem: Production must happen in-game without becoming a per-frame economy simulation.
Solution: `main.ts` calls `tickProduction()` every 60 frames; the production system itself exits unless `state.time >= nextTickAt`, normally 30-240 seconds.
Rejected Alternatives: Running production from renderer/HUD or scanning every container every frame.
Scalability potential: Low no production until debug; Middle slow ticks; High shortage events/contracts; Ultra offline debug simulation.
Hardware Impact: Most calls return after checking a small registered list. Estimated normal cadence cost 10-80 us once per second on i3/MX350, 0 us on intervening frames.

Problem: Optional AG10 state must not break old saves.
Solution: Save economy/production if present; normalize missing economy on load and default missing production to an empty list.
Rejected Alternatives: Hard save schema migration or serializing full generated `World`.
Scalability potential: Low tolerates absent fields; later builds can persist richer state behind optional keys.
Hardware Impact: Load/save only, no frame impact.

## Loop 4 Documentation/Build

Problem: README claimed old debug command count and had no factual record of AG10 economy/container/production/contracts.
Solution: Added concise factual sections and updated debug command table to match implemented commands.
Rejected Alternatives: Broad README rewrite or documenting future features not present in code.
Scalability potential: Keeps designer-facing facts aligned with current code while leaving future expansion to `desdoc.md`.
Hardware Impact: Documentation only, 0 us/frame.

## Loop 5 Polish

Problem: Polish mandate required proof that no market sim runs every frame, all arrays are capped, and container access cannot duplicate items.
Solution: Audited AG10 systems and main loop. Production is only called once per second and exits unless room timers expire. Container creation is capped at 128. Production registrations are capped at 64. `putIntoContainer()` now respects target stack free capacity before removing from actor inventory.
Rejected Alternatives: Leaving soft caps implicit through room counts, or relying on `removeItem()` after overfilling an existing stack.
Scalability potential: Low/Middle stay bounded on weak devices; High/Ultra can increase caps deliberately behind debug/settings later.
Hardware Impact: Hard caps prevent pathological generation spikes. Stack-cap fix has negligible per-use cost, estimated under 5 us.
