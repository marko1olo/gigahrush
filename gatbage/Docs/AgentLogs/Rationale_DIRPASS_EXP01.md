# Rationale_DIRPASS_EXP01

Agent: DIRPASS_EXP01  
Domain: Expansion 01 Mushroom Shift director-hook pass  
Date: 2026-05-17

## Decision 1: Director sees facts, not farm internals

Problem: Mushroom Shift owns farm growth, contamination, harvest, and mutation state. Letting the director tick farms or inspect room internals would create a second scheduler and break the room-level production contract.

Solution: Define a single `mushroom_shift` signal provider that emits compact facts: cellar-known, active counts, recent harvest/spoilage/mutation, ration pressure, market supply, and sanitary risk. Director beats consume those facts and call small effects through adapters.

Rejected Alternatives: Direct director imports into mushroom farm state were rejected because they couple two future systems and invite refactoring loops. Per-frame polling was rejected because the director target is 0 us/frame steady-state.

Scalability potential: Low tier emits a few facts for one active farm. Middle exposes several farms and local prices. High adds chain state and theft/sanitary pressure. Ultra adds richer presentation without increasing director tick frequency.

Hardware Impact: On i3/MX350, bounded signal collection avoids world-cell and NPC scans. Estimated saved time versus naive `rooms x farms x NPC` checks is 100-700 us on director ticks and 0 us on ordinary frames.

## Decision 2: Mushroom beats are social aftermath, not hidden farming commands

Problem: The director could become a hidden god that changes food, inventory, doors, or growth to force drama. That would make farm outcomes feel fake and duplicate the mushroom system.

Solution: Beat effects are limited to rumors, access pressure, queue claims, market demand flags, sanitary notices, cult/science hints, and theft-risk scheduling. Farm growth, harvest outputs, item stacks, and door locks remain owned by their target systems.

Rejected Alternatives: Director-owned item mutation was rejected because it bypasses inventory/container ownership. Director-owned door locking was rejected because samosbor and local room systems own access control. Spawning inspectors or traders directly was rejected because content modules own NPC placement.

Scalability potential: Low uses HUD/log and dialogue flags. Middle forwards to market and ration adapters. High connects to hospital/raionsovet/cult pressure. Ultra can add richer audio/visual aftermath while keeping command boundaries stable.

Hardware Impact: Small adapter effects occur only on beat selection. Estimated normal-frame impact is 0 us; beat-time cost should remain below 50 us without external adapter work.

## Decision 3: Three chains cover shortage, relief, and mutation

Problem: EXP00 names `fungal_shortage_chain`, but Mushroom Shift also needs a positive access path and a samosbor mutation path. Without explicit chain slots, future code would overload one chain with incompatible conditions.

Solution: Define `fungal_shortage_chain`, `fungal_relief_chain`, and `mutated_crop_chain`. Shortage handles spoilage -> market -> sanitary. Relief handles cellar whisper -> harvest claim -> demand. Mutation handles wet/meat/PSI aftermath -> faction/science fork -> inspection.

Rejected Alternatives: One long mushroom chain was rejected because it would become a quest rail. Independent one-off beats were rejected because they would not give the director a coherent campaign memory.

Scalability potential: Low uses only relief/shortage first slots. Middle uses market and ration slots. High and Ultra use mutation branches and cross-expansion escalation.

Hardware Impact: Chain state is tiny: IDs, step index, cooldown timestamps. Estimated memory impact is a few hundred bytes; CPU impact is negligible compared with beat filtering.

## Decision 4: Cooldowns are grouped by pressure type

Problem: Food production can generate many valid facts: harvest, spoilage, mutation, queue pressure, market demand. Without shared cooldown keys, the director could punish one farm event repeatedly.

Solution: Group cooldowns by discovery, contamination pressure, market pressure, ration claim, samosbor aftermath, and backlash. Mutation beats share one samosbor aftermath cooldown per cycle.

Rejected Alternatives: Per-beat cooldown only was rejected because spoilage rumor and sanitary notice could fire back-to-back too often. Global mushroom cooldown only was rejected because it would block useful relief after a threat.

Scalability potential: Low avoids spam with simple keys. Middle and High allow different pressure lanes. Ultra can add more text variants under the same cooldown semantics.

Hardware Impact: Cooldown lookup is beat-id/key map work on rare tick only. Estimated cost is under 10 us per candidate set and 0 us/frame steady-state.

## Decision 5: Trace must include mushroom-specific reason codes

Problem: Generic chosen/rejected beat IDs are insufficient to diagnose why food pressure happened. The black-box requirement demands useful evidence when a beat feels wrong.

Solution: Require reason codes such as `mushroom_recent_harvest`, `mushroom_recent_spoilage`, `mushroom_samosbor_aftermath`, `mushroom_missing_signal`, and adapter failure codes. Trace also records expansion ID, chain ID, room, zone, recent event, cooldown key, and budgets when known.

Rejected Alternatives: Text-only visible trace was rejected because it cannot support debug filtering. Dumping unbounded payloads was rejected because trace must remain fixed-size and cheap.

Scalability potential: Low debug can explain one cellar. Middle can explain market/ration pressure. High and Ultra can explain multi-expansion chains without reading the whole world state.

Hardware Impact: Trace writes are fixed-size beat-time records. Estimated beat-time cost is 5-30 us; ordinary frame cost remains 0 us.

## Decision 6: Integration contract gets a pointer, not duplicate bulk

Problem: `integration_contract.md` already owns broad mushroom system boundaries. Duplicating the entire director hook spec there would create two sources of truth.

Solution: Add a focused Director Integration section that points to `director_hooks.md`, summarizes provider, chain, trace, and non-interference boundaries, and leaves detailed beats in the new hook file.

Rejected Alternatives: No integration update was rejected because future implementers could miss the director document. Full duplication was rejected because it creates drift.

Scalability potential: The local contract remains readable while the director hook contract can evolve as a focused artifact.

Hardware Impact: Documentation-only. Runtime impact 0 us.

## Decision 7: No compile run for docs-only director pass

Problem: This task forbids source code changes. Running a build would validate concurrent source changes by other agents and could produce irrelevant failures.

Solution: Verify scope with git status and record that compile was not run because only markdown changed.

Rejected Alternatives: Running build as performative validation was rejected because it does not validate markdown and may misattribute unrelated failures. Skipping all verification was rejected; scope verification is still required.

Scalability potential: Keeps doc-only director passes decoupled across expansion workers. Future code implementation remains subject to build/check requirements.

Hardware Impact: No runtime impact. Saves local build wall time; frame-time relevance 0 us.
