# Rationale_EXP08_INDUSTRY

## Decision 1: One Briquette Line Only

Problem: Expansion 08 contains many attractive factories: briquette press, rebar, filters, weapons, quality lab, meat plant. Implementing or planning them as equal MVP targets would create a spreadsheet expansion without a playable loop.

Solution: The MVP is one line, `industry08.briquette_press`, with one input chain, one aggregate shift, one output crate/supply ledger and one quality decision. Rebar, filters and packaging are named but reserved/data-only.

Rejected Alternatives: A full INDUSTRY floor was rejected because root expansion/index says new floor comes after pocket proof. A multi-line production sim was rejected because it would invite direct dependencies on economy/market work owned by other agents and would hide missing gameplay behind volume.

Scalability potential: Low uses manual/debug tick and static line state. Middle adds scheduled slow tick and shift modifiers. High adds faction control and two samosbor variants. Ultra adds visual overkill and more lines only after the deterministic MVP loop survives.

Hardware Impact: Low-end i3/MX350 target remains 0 us/frame steady-state because production is explicit/slow tick. Expected production event cost stays below 150 us low, 300 us middle and 600 us high in planning targets.

## Decision 2: Abstract Supply Before Item Stacks

Problem: A factory that spawns item stacks every minute can flood containers, distort prices and add work unrelated to player-visible consequences.

Solution: Production emits `IndustrySupplyDelta` first. Concrete items are created only in a bounded output container, quest reward or debug path. Bulk meaning stays in supply ledger, price/scarcity and events.

Rejected Alternatives: Direct floor drops were rejected as balance noise. Per-item global queues were rejected as runtime bloat. A pure text-only supply was rejected because the MVP needs a visible output crate.

Scalability potential: Low has one crate and local snapshot. Middle connects to container/economy ports. High sends faction/market events. Ultra can show richer stock visuals without increasing production math frequency.

Hardware Impact: On weak devices this avoids world-entity growth and item scans. On top-tier devices the saved CPU buys conveyor, lamp, steam and audio visuals gated by distance/visibility.

## Decision 3: Aggregate WorkShiftState

Problem: Simulating every worker in a factory would collide with existing A-Life and schedules, and would make output depend on full NPC scans.

Solution: The line consumes a bounded `WorkShiftState` with morale, injury, hunger, fear, pressure, workerMinutes and sabotageRisk. Named NPC are anchors for interaction, not required for the production calculation.

Rejected Alternatives: Per-worker simulation was rejected because it is too costly and fragile in a multi-agent codebase. Pure decorative NPC were rejected because the user requested work shifts with mechanical effect.

Scalability potential: Low uses static shift fields. Middle lets player actions alter morale/injury/hunger. High can feed workerMinutes from schedule adapters. Ultra can make the pocket visually crowded while the math remains aggregate.

Hardware Impact: No NPC-array scan in production math. i3/MX350 cost is bounded to one pure function call per explicit tick; high-end machines spend visual budget on animated workers/props later.

## Decision 4: Ports And Events Instead Of Direct Dependencies

Problem: The repository is under simultaneous multi-agent edits. Direct imports from economy, market, containers or contracts may break when another agent changes file names or data shapes.

Solution: `integration_contract.md` defines `IndustrySupplySink`, `IndustryContainerPort`, `IndustryContractPort` and structured `IndustryEvent` payloads. Missing consumers degrade to local snapshots/debug output.

Rejected Alternatives: Directly naming Expansion 05 market modules was rejected as cross-domain coupling. Creating a parallel economy was rejected as duplicate authority.

Scalability potential: Low works standalone. Middle plugs into containers/contracts. High plugs into economy/market/faction reactions. Ultra can add cross-expansion supply chains without changing line state.

Hardware Impact: Adapter calls are event-cadence only and allocate no persistent per-frame work. Low-end hardware avoids background systems; high-end hardware can add richer consumers later.

## Decision 5: Quality Decision As The Human Cost

Problem: Production can become a sterile spreadsheet if the only action is "fix line, get food".

Solution: The MVP includes a quality office decision: release, hold or divert a suspect batch. The choice affects supply plus NPC/faction/log consequence.

Rejected Alternatives: A generic repair-only quest was rejected because it fails the industrial horror requirement. A lore-only recipe note was rejected because it does not change the world.

Scalability potential: Low changes local supply and one log. Middle affects market scarcity and worker trust. High adds cult/black-market/liquidator consequences. Ultra can branch visual state and raids while preserving one deterministic decision path.

Hardware Impact: One decision event and bounded state delta. No frame cost; consequence work occurs only at completion.

## Decision 6: Black Box Telemetry Planned At Interface Level

Problem: Production bugs are difficult to explain when inputs, output, defect and samosbor variants interact.

Solution: The integration contract reserves `IndustryTelemetryEntry` and requires a fixed 300-entry circular buffer in future code, dumping to `Docs/AgentLogs/Dump_EXP08_INDUSTRY.bin` on NaN/crash.

Rejected Alternatives: Text-only debug logs were rejected because they may miss the last failing state. Full JSON history was rejected as too large and allocation-prone.

Scalability potential: Low writes quantized hashes and flags. Middle adds event seq and reason hashes. High/Ultra can correlate with economy/market events but keep the ring size fixed.

Hardware Impact: Fixed-size buffer avoids allocation churn. On low-end silicon the cost is one struct write per explicit production event, not per rendered frame.

