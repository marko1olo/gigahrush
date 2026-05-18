# Rationale_DIRPASS_EXP00

## Decision 1: Make `director_hooks.md` The Hook Authority

Problem: Expansion 00 already had a broad integration contract, but it did not fully define the cross-expansion hook vocabulary for registry, providers, chains, rejection reasons, trace and debug.

Solution: Add a dedicated `director_hooks.md` with code-shaped data contracts and keep `integration_contract.md` as the boundary summary. This follows the DOD pattern of separating technical contract detail from ownership summary.

Rejected Alternatives: Expanding `integration_contract.md` into a large mixed document was rejected because it would bury the hook surface inside implementation notes. Updating every expansion folder was rejected because this agent owns only Expansion 00.

Scalability potential: Low uses a small beat/provider set and one chain. Middle adds scarcity, documents and medical/market signals. High adds production, quarantine, faction and numbered-floor hints. Ultra keeps the same logic cap and spends saved CPU on presentation, lines, sounds and foreshadowing.

Hardware Impact: No runtime impact in this pass. Future low-end target is `0 us/frame` steady state and rare tick selection under 50 us on weak devices such as i3/MX350-class hardware.

## Decision 2: Use Optional Signal Providers Instead Of Direct Expansion Imports

Problem: The repository is under parallel agent work, and direct imports from unfinished expansion systems would create brittle compile dependencies.

Solution: Define `DirectorSignalProvider` and registry APIs. Missing providers reject beats with `missing_signal_provider`, while debug exposes disabled integrations.

Rejected Alternatives: Hardcoding expansion lookups in the director was rejected because it would couple Expansion 00 to unmerged code. Building a separate event bus inside the director was rejected because project contracts already prefer shared events/logs or local bounded fallbacks.

Scalability potential: Low can run from campaign flags and recent events. Middle/High can add provider adapters without changing director selection logic. Ultra still does not increase hot-path work.

Hardware Impact: Provider collection is rare tick/event-bound and caller-output based, avoiding per-frame scans and large transient allocations on low-end silicon.

## Decision 3: Treat `no_legal_beat` As Valid Silence

Problem: A campaign director that always picks something becomes pressure spam and starts faking game causality.

Solution: Make `no_legal_beat` a stable reason code and debug-visible trace result. Budgets, cooldowns, act gates and missing signals can correctly produce silence.

Rejected Alternatives: Fallback random beat selection was rejected because it violates predictability and makes trace dishonest. Ignoring rejection reasons was rejected because debugging pacing failures would become guesswork.

Scalability potential: Low devices avoid unnecessary work and events. Middle/High campaigns can have more beats without forcing constant output. Ultra presentation can remain dense when legal beats exist while preserving silence when budgets say stop.

Hardware Impact: Saves CPU by ending selection after bounded evaluation and prevents downstream effect work when no beat is legal.

## Decision 4: Black-Box Trace Is Mandatory And Bounded

Problem: Director decisions will be cross-system and hard to diagnose without evidence. Unbounded logs would create memory and serialization risk.

Solution: Require exactly 300 `DirectorTraceEntry` records in a ring buffer, with chosen beat, top rejection, budget state, hashes and samosbor context. Dumps use runtime path support when available; otherwise debug exposes copyable trace.

Rejected Alternatives: Console-only debug was rejected because it disappears and cannot support post-crash analysis. JSON logging during gameplay was rejected because it allocates and creates hot-path risk.

Scalability potential: Low/Middle use compact entries. High/Ultra can add richer presentation outside the trace while keeping the same diagnostic core.

Hardware Impact: One fixed ring write per rare tick or event-bound decision is acceptable; steady-state remains `0 us/frame`.
