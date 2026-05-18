# Rationale DIRPASS_EXP10

## Decision 1: Director owns pacing, Void owns protocol authority

Problem: Director hooks could accidentally make the director a second protocol system that grants, applies, resolves and explains Void state without the future `void_protocols.ts` owner.

Solution: `director_hooks.md` defines director effects as requests into a Void adapter. Protocol ownership, cooldowns, target validation, marks, backlash and `VoidProtocolTrace` remain with the Void protocol system. Director trace only cross-references `protocolId`, `markId`, `targetKey` and `voidTraceId`.

Rejected Alternatives: Direct director mutation of marks or direct application of `seal_seam` was rejected because it couples pacing to gameplay authority and creates two black boxes. Standard Unity-style central manager behavior is irrelevant here and too invasive for this TypeScript/Vite architecture.

Scalability potential: Low uses only `seal_seam` unlock/hint/backlash. Middle adds trace echo/refusal. High adds archive, NPC memory and route adapters. Ultra spends saved budget on presentation, not more scheduler logic.

Hardware Impact: Estimated steady-state gain for low-end i3/MX350 is preserved `0 us/frame`; rare director work stays bounded to active Void marks, recent traces and one current target candidate.

## Decision 2: `seal_seam` is the director MVP chain, not the whole protocol catalog

Problem: Expansion 10 contains several late protocols, but only `seal_seam` has a full MVP loop suitable for director pacing without requiring archive, route or NPC memory implementations.

Solution: The primary chain `void_backlash_chain` is unlock -> target hint/relief window -> backlash resolution -> trace echo. Record, tenant and route beats are present as adapter-backed late hooks that reject cleanly when unsupported.

Rejected Alternatives: Making every protocol a first-class director chain now was rejected as false completeness and cross-agent dependency risk. A single generic "Void event" beat was rejected because it cannot validate target, cooldown, backlash or trace.

Scalability potential: Low ships one playable chain. Middle can add cooldown refusal and trace echo. High can enable document/NPC/route aftershocks when their adapters exist. Ultra can add richer lines and visual effects without changing logic cost.

Hardware Impact: Expected low-end cost remains event-bound; `seal_seam` hinting uses one current interact candidate, not a scan over doors.

## Decision 3: Trace echo is separate from backlash

Problem: If backlash text is the only explanation, players can read protocol consequences as random bugs. If every trace becomes player text, late-game noise will spike.

Solution: The contract separates `void_backlash_compensation_due` from `void_trace_echo`. Backlash resolves one mechanical consequence. Trace echo converts one structured Void trace into sparse diegetic feedback with dedupe and cooldown.

Rejected Alternatives: Always surfacing every protocol trace was rejected as log spam. Hiding trace entirely was rejected because the expansion explicitly requires a black-box explanation path.

Scalability potential: Low can expose one echo after `seal_seam`. Middle increases trace categories. High and Ultra add voice/UI presentation while preserving the same bounded trace source.

Hardware Impact: Dedupe by trace hash prevents repeated string formatting. Gameplay evaluation reads primitive trace facts only; formatted text runs only on selected beat/debug.

## Decision 4: Late-act adapter hooks degrade to typed rejection

Problem: Expansion 10 is meant to return to older expansion systems, but this pass cannot edit or depend on those folders. Direct dependencies would break simultaneous agents.

Solution: Document beats for record contradiction, tenant memory aftershock and blind route warning require adapter/status signals. Missing integrations reject with `missing_cross_expansion:*` or `missing_npc_memory_adapter`.

Rejected Alternatives: Importing or naming future implementation modules directly was rejected because other agents may not have finished them. Silent no-op fallback was rejected because it destroys debug trust.

Scalability potential: Low ignores unavailable adapters. Middle exposes provider status. High enables cross-expansion beats as systems arrive. Ultra adds presentation variations without changing adapter boundaries.

Hardware Impact: Adapter status is one primitive signal per adapter, so low-end devices avoid exception paths and global searches.

## Decision 5: Integration contract update stays local and minimal

Problem: The local `integration_contract.md` did not point future implementers to director hooks, but broad contract edits were outside scope.

Solution: Added a small Director Integration section to Expansion 10 only. It names the director's allowed role and preserves Void protocol authority.

Rejected Alternatives: Updating root expansion documents, Director foundation docs, README or indices was rejected by explicit write-scope limits.

Scalability potential: The local pointer is enough for future implementation agents to find the hook contract without global documentation churn.

Hardware Impact: Documentation-only; 0 runtime cost.
