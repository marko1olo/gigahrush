# LOG DIRPASS_EXP10

## Director-hook pass for Expansion 10

What was wrong: `Docs/Expansions/10_void_afterprotocol` had a strong Void protocol design and integration contract, but no director-facing contract for Expansion 00. Future implementers had no local source for beat IDs, signal facts, chain slots, cooldowns, trace cross-references or debug validation.

What was done: Added `Docs/Expansions/10_void_afterprotocol/director_hooks.md` as the implementation-ready contract for `void_afterprotocol`. It defines late-act protocol unlock, `seal_seam` target hint, relief window, backlash compensation, trace echo, record contradiction, tenant memory aftershock, blind route warning and cooldown refusal beats. It also defines signals, conditions, blocking conditions, adapter effects, shared cooldowns, budget costs, `void_backlash_chain`, `afterprotocol_return_chain`, trace fields, debug validation, performance tiers and non-interference rules.

What was done: Updated only local `Docs/Expansions/10_void_afterprotocol/integration_contract.md` with a short Director Integration section. The section points to `director_hooks.md` and states that the director may pace/unlock/hint/reveal/echo, but cannot apply protocols, scan anchors, rewrite samosbor or mutate other expansion systems directly.

What was done: Created `Docs/Tasks/Status_DIRPASS_EXP10.md` and `Docs/AgentLogs/Rationale_DIRPASS_EXP10.md` for persistent task state and decision rationale.

Cinematic Cheats used: No simulation was added. The director contract uses sparse trace echo, world-log/voice feedback, target hints and adapter requests instead of continuous VOID simulation, route simulation, memory simulation or global samosbor manipulation.

Exact Microseconds saved: Steady-state target remains `0 us/frame`. Signal collection is specified as O(active Void marks + recent bounded Void traces + one current target candidate). This avoids all-world scans over doors, documents, NPCs, rooms or routes. Expected rare-tick/director event work for low tier stays below 50 us on weak devices when only `seal_seam` signals are present.

Validation: Documentation-only pass. No TypeScript compile, unit test, build or smoke run was required because no source files changed.
