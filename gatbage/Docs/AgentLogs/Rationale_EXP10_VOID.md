# Rationale_EXP10_VOID

## Decision 1: Registry Missing, Mandates Still Applied

Problem: The instruction required reading `.agents-skills/`, but `/Users/jirnyak/Mirror/gigahrush/.agents-skills` does not exist.

Solution: Used direct filesystem evidence, recorded absence, and applied relevant mandates from the user-provided AGENTS block and expansion index: domain boundary, simultaneous execution, cinematic cheat, frame-time dictatorship, Math LOD, Black Box, additive integration, file-based reporting.

Rejected Alternatives: Inventing mandate names or reading unrelated agent files would create fake compliance. Continuing silently was rejected because missing registry evidence affects reviewability.

Scalability potential: Low devices get one manual command-based protocol and fixed traces; middle gets room/zone marks; high gets optional expansion adapters; ultra gets VOID visual overkill without continuous simulation.

Hardware Impact: On i3/MX350-class hardware, avoiding global scans and continuous VOID simulation protects the 0.1 ms suspicion budget. Expected idle cost is 0 us; active command/event work targets 20-120 us.

## Decision 2: MVP Is `seal_seam`, Not A Broad Magic Catalog

Problem: Expansion 10 can easily become abstract lore or a list of "change reality" abilities that disable survival horror.

Solution: `implementation_plan.md` makes `seal_seam` the first complete vertical slice: obtain protocol, target one hermdoor, apply local mark, survive next samosbor, receive backlash, see trace/debug.

Rejected Alternatives: Implementing all five original protocols equally would spread risk across archive, NPC memory, route and market systems before one loop is proven. A pure VOID room was rejected because the index requires input, risk, result, consequence and debug visibility.

Scalability potential: Low: one door protocol. Middle: room/zone effects. High: adapters for archive, metro, market, hospital, school, industry. Ultra: stronger VOID presentation while logic stays event-bound.

Hardware Impact: One door target avoids scanning all doors. Local target validation is expected at 20-60 us per player command, with no per-frame overhead.

## Decision 3: Additive Samosbor Hook Instead Of Rewrite

Problem: Void protocols must interact with samosbor, but rewriting `samosbor.ts` would collide with other agents and risk breaking the antagonist system.

Solution: `integration_contract.md` defines `onVoidSamosborEvent()` and narrow hook events such as `door_seal_check`, `samosbor_started` and `samosbor_ended`. Samosbor asks local questions; `void_protocols.ts` owns marks, traces and backlash.

Rejected Alternatives: Moving samosbor logic into protocol code, adding global protocol branches inside every samosbor path, or disabling samosbor per zone were rejected. Standard large refactor is too slow and violates the task.

Scalability potential: Low uses one door check. Middle adds zone warning response. High and ultra add more adapter consumers, but samosbor stays a publisher/query point.

Hardware Impact: Event-bound checks target 50-120 us only when samosbor emits relevant events. Baseline samosbor without marks should remain unchanged.

## Decision 4: Structured Trace Before Player Text

Problem: Late-game rule changes become impossible to debug if they only produce HUD strings.

Solution: The contract defines `VoidProtocolTrace`, event shapes and bounded state. Player-facing text is derived from traces/world events. Debug shows protocol id, target key, backlash id and reject reason.

Rejected Alternatives: Direct `state.msgs.push()` as the source of truth was rejected because it cannot explain future door, NPC or route changes. Unbounded text history was rejected because it bloats save/state.

Scalability potential: Low uses 64-128 traces. Middle/high use world log buffers. Ultra can render trace inspection as a diegetic device without changing storage rules.

Hardware Impact: Fixed trace push is predictable. Estimated cost is single-digit microseconds for buffer write, with debug formatting only on request.

## Decision 5: Local Backlash, Not Random Punishment

Problem: If backlash appears unrelated, players will read it as a bug or unfair randomizer.

Solution: The manifest defines backlash tied to target locality: route degradation near a sealed door, silent warning in same zone, false record near restored document, fear memory on affected NPC.

Rejected Alternatives: Random monster spawns anywhere, global difficulty increases or permanent save corruption were rejected. They are cheap to implement but destroy readability and controllability.

Scalability potential: Low uses scripted route/silent backlash. Middle adds local candidates. High adds adapter candidates. Ultra can show stronger feedback through overlays and voices.

Hardware Impact: Candidate collection is limited to current room/zone/radius. It avoids 1024x1024 scans and should stay under 50-120 us on event resolution.

## Decision 6: VOID Uses Cinematic Cheats

Problem: VOID presentation needs to feel impossible, but real impossible geometry, physics or continuous simulation would be expensive and fragile.

Solution: The plan uses rectangular/pocket rooms with palette swaps, static missing-wall textures, sprite ghost overlays, UI distortion and repeated voice/log fragments. Logic stays command-based.

Rejected Alternatives: Runtime non-Euclidean geometry, fluid-like void spread, particle-heavy metaphysics and per-frame room morphing were rejected. They spend performance without improving the protocol loop.

Scalability potential: Low gets one stark protocol chamber. Middle gets a few pocket nodes. High gets adapter-linked traces. Ultra spends saved cycles on visual overkill, not more state simulation.

Hardware Impact: Static texture and overlay cheats keep low-tier cost near existing rendering cost. Expected protocol logic idle cost remains 0 us.

## Decision 7: Optional Cross-Expansion Adapters

Problem: Expansion 10 is designed as final glue, but other expansion systems may not exist or may be edited by other agents.

Solution: The contract defines `VoidProtocolAdapter` with `supportsTarget`, `validateAnchor`, local effect and backlash candidate methods. Missing adapters return `unsupported_adapter`.

Rejected Alternatives: Direct imports from every expansion or invented dependencies on future code were rejected. That would break simultaneous execution and compile stability.

Scalability potential: Low compiles with no adapters. Middle adds route/document hooks. High and ultra integrate previous expansions incrementally with no central rewrite.

Hardware Impact: Adapter lookup is bounded and event-driven. Unsupported systems fail fast, saving future debugging and preventing accidental global scans.

## Decision 8: Documentation-Only Scope

Problem: User explicitly limited write scope to Expansion 10 docs and EXP10 status/rationale/log.

Solution: Created only `implementation_plan.md`, `content_manifest.md`, `integration_contract.md`, `Docs/Tasks/Status_EXP10_VOID.md`, `Docs/AgentLogs/Rationale_EXP10_VOID.md` and `Docs/AgentLogs/LOG_EXP10_VOID.md`.

Rejected Alternatives: Updating `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md`, code, or other expansion folders would violate scope and collide with other agents.

Scalability potential: Clean scoped planning lets future implementation split across protocol data, resolver, debug and adapters without merge damage.

Hardware Impact: No runtime impact because no code changed.
