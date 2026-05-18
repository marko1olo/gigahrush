# Rationale DIRPASS_EXP08

## Decision 1: Director schedules factory pressure, industry owns production

Problem: Expansion 08 needs campaign timing for failures, bad batches and supply relief without turning the director into a factory simulator.

Solution: `director_hooks.md` defines industry beats as declarative director rows. Effects are adapter requests into industry, contract, supply, rumor or economy owners. The director chooses when a beat is legal; industry remains the owner of `FactoryLineState`, `WorkShiftState`, quality decisions, supply deltas and production telemetry.

Rejected Alternatives: Direct director mutation of line state, output buffers, containers or item stacks was rejected because it violates both the director non-interference contract and the industry aggregate supply contract. A private industry scheduler was rejected because it would duplicate campaign pacing.

Scalability potential: Low uses one briquette line, one shift and one shortage signal. Middle adds input, injury, morale and defect beats. High adds faction and samosbor aftermath chains. Ultra spends saved CPU on visible industrial overkill, audio and richer rumors, not live factory simulation.

Hardware Impact: Steady runtime impact remains 0 us/frame. The provider reads bounded aggregate state on rare director ticks or explicit events only, avoiding global scans on i3/MX350 class machines.

## Decision 2: Work-shift signals are aggregate pressure, not NPC simulation

Problem: Work shifts must feel human and reactive, but scanning worker NPCs for director decisions would create ownership and frame-time risk.

Solution: Hooks consume `WorkShiftState` fields as quantized signals: hunger, injury, fear, morale and sabotage risk. Named NPCs remain anchors for dialogue/contracts; they are not required for director selection.

Rejected Alternatives: Per-NPC worker attendance scans, schedule interrogation or live morale propagation were rejected as slow and cross-domain. Flavor-only worker text was rejected because every director signal needs a mechanical consumer.

Scalability potential: Low exposes hunger/injury only. Middle adds fear and sabotage. High/Ultra can consume faction pressure and richer aftermath lines through the same signal provider.

Hardware Impact: One aggregate shift read is effectively constant-time and avoids pathfinding or schedule churn. Estimated savings versus naive worker scans are hundreds to thousands of microseconds during busy floors.

## Decision 3: Bad concentrate is a chain slot with trace, not a hidden moral toggle

Problem: The strongest industry beat is releasing defective food, but it must create systemic consequence without silently rewriting school, market or health systems.

Solution: The contract defines `industry08.quality.bad_batch_hold`, `industry08.quality.release_dirty_batch` and `industry08.quality.divert_to_cult_buyer` with explicit signals, effects, cooldowns and chain slots. The bad-concentrate school chain receives compact ids and quantized defect data only.

Rejected Alternatives: Direct poisoning of NPCs, direct school state mutation and unbounded defective item spawning were rejected because they require foreign ownership and break the aggregate supply rule.

Scalability potential: Low records a bad batch flag and local log. Middle routes price/supply pressure. High connects school, market and cult pressure. Ultra can add presentation and rumors without changing the core data shape.

Hardware Impact: Chain state stores compact ids and event sequence values, keeping memory stable and avoiding runtime scans.

## Decision 4: Samosbor aftermath applies once per event sequence

Problem: Samosbor variants can contaminate or transform factory output, but repeated director ticks must not stack the same aftermath forever.

Solution: Hooks require a recent samosbor event sequence and the industry adapter must apply variant deltas idempotently once per sequence. Classic, meat, wet and electric variants have separate beats and cooldowns.

Rejected Alternatives: Applying contamination every rare tick while the variant remains recent was rejected as runaway state drift. Direct fog-cell inspection was rejected because industry needs event facts, not full samosbor simulation.

Scalability potential: Low supports classic and meat. Middle adds wet/electric effects. High and Ultra can add richer variant-specific presentation while preserving idempotent aggregate math.

Hardware Impact: Event-sequence gating is constant-time and prevents accidental repeated work. It also keeps trace explanation deterministic.

## Decision 5: Trace/debug is mandatory for production consequences

Problem: Director-driven supply and quality outcomes can look arbitrary unless a developer can explain why a beat fired or was rejected.

Solution: The hook contract defines required trace fields, industry signal hashing, debug commands and negative tests for missing provider, quest cap and duplicate aftermath. Status/log files record that this is a docs-only pass.

Rejected Alternatives: Human-readable prose without trace/debug fields was rejected because it cannot support black-box diagnosis. Chat-only reporting was rejected because project protocol requires disk logs.

Scalability potential: Low prints provider/beat status. Middle/High route traces to director debug and world facts. Ultra can add richer visible feedback without increasing director logic cost.

Hardware Impact: Bounded 300-entry director trace and industry telemetry are memory-stable. No unbounded logs or per-frame formatting are required.

