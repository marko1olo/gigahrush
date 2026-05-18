# Rationale DIRPASS_EXP05

## Decision 1: Market hooks are director-owned decisions, market-owned effects

Problem: The market expansion needs campaign pacing without turning the director into an illegal-economy subsystem.

Solution: `director_hooks.md` defines beats as director-selectable rows, but every effect is routed through market adapters, event facts, quest/contract wrappers or bounded state fields. The director chooses when pressure is legal; market systems remain the owner of heat, scarcity, stock locks, debt lifecycle and trader access.

Rejected Alternatives: Direct director mutation of item stacks, trader stock or debt arrays was rejected because it would violate the Director non-interference contract and duplicate AG10 economy/container behavior. A separate market scheduler was rejected because it would fragment campaign pacing.

Scalability potential: Low uses one pocket and static demand tags; Middle adds event-driven scarcity and overdue debt beats; High consumes samosbor/faction/production signals; Ultra spends saved CPU on richer trader presentation and cross-expansion lines, not live buyer simulation.

Hardware Impact: Steady runtime impact remains 0 us/frame because hooks are evaluated only on director rare tick or explicit events. Low-end i3/MX350 class machines avoid global scans and live economy simulation.

## Decision 2: Scarcity is represented as tags and lane pressure, not live market simulation

Problem: Scarcity/debt/raid beats need to feel responsive to samosbor and other expansions without scanning inventories, containers, rooms or NPC buyers.

Solution: Hooks consume compact director signals such as `scarcity.survival`, `market88.heat`, `market88.debt.overdue`, `samosbor.variant.electric`, `faction.liquidator_pressure` and `market88.access.password`. Effects set demand modifiers, trader locks, contract offers or trace facts through bounded adapters.

Rejected Alternatives: Per-frame price recomputation and live buyer demand were rejected as expensive theater. Global container sampling was rejected because market contract already states AG10 owns economy/resources.

Scalability potential: Low uses static lane multipliers. Middle updates on samosbor/contract/raid events. High and Ultra can add cross-expansion goods without changing the director hook shape.

Hardware Impact: Rare event update cost is estimated below 100-500 us depending on tier, with no steady frame tax. This protects cheap devices while leaving headroom for denser market visuals on stronger hardware.

## Decision 3: Raids are cooldowned scripted pressure, not patrol simulation

Problem: Market raids must produce consequences without becoming NPC-spawn loot farms or a second combat director.

Solution: Raid hooks use heat thresholds, overdue debt, forged document failure, cult/PSI demand and samosbor aftermath as conditions. Effects apply timed locks, stock damage, warning traces, one encounter hook or contract pressure. Every raid has a cooldown and debug validation row.

Rejected Alternatives: Persistent liquidator patrols and large guard spawns were rejected because they would touch AI/pathfinding ownership and risk frame-time bloat. Loot-heavy raids were rejected because the market package explicitly forbids loot pinatas.

Scalability potential: Low raids are state locks and HUD/log consequences. Middle adds one local pressure encounter. High uses faction ownership and archive/metro signals. Ultra adds richer presentation only inside the pocket.

Hardware Impact: Scripted lock/trace effects are effectively 0 us/frame and avoid pathfinding churn on i3/MX350 class hardware.

## Decision 4: Chain slots are named contracts, not hidden story rewrites

Problem: The director needs cross-expansion chains, but the market cannot pull in unfinished expansion code or rewrite main story.

Solution: Chain slots are declared as signal/effect contracts with stable ids. They attach to director chains only when both sides expose signals. Market contracts convert through existing Quest/Contract adapters and use `market88` tags, never `PLOT_CHAIN`.

Rejected Alternatives: Hard dependencies on mushroom, metro, hospital, school or factory modules were rejected because the user explicitly noted parallel agents. Story-chain mutation was rejected because market contracts are side content.

Scalability potential: Low ignores unavailable chain partners. Middle enables two-part chains. High/Ultra can add richer multi-expansion chains through the same slots.

Hardware Impact: Missing adapters cause `missing_signal_provider` rejection, so unavailable systems cost only one bounded beat evaluation.

## Decision 5: Trace/debug is part of the contract, not polish

Problem: Director-driven economy changes can look arbitrary unless every choice is explainable.

Solution: `director_hooks.md` requires trace reason codes, visible trace text, debug command expectations and validation rows. Rejections such as missing signal, cooldown, budget and act gate are explicit.

Rejected Alternatives: Human-readable docs without trace fields were rejected because they cannot support black-box debugging. Chat-only reporting was rejected because the project protocol requires disk logs.

Scalability potential: Low emits text debug. Middle/High route traces to world events and director trace. Ultra can add richer visible feedback while preserving the same audit rows.

Hardware Impact: A 300-entry bounded trace is memory-stable and avoids unbounded logs on weak devices.
