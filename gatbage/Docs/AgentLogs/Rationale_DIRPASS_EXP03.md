# Rationale DIRPASS_EXP03

Date: 2026-05-17  
Scope: director-hook pass for `Docs/Expansions/03_raionsovet_archive`

## Decision 1: Separate Hook Contract

Problem: EXP03 needed director integration without changing source code or shared expansion index files.

Solution: Created `director_hooks.md` as a local contract containing stable `exp03.*` beat ids, signals, effects, cooldowns, chain slots, trace payloads and debug validation. This keeps director wiring implementation-ready without pretending runtime code exists.

Rejected Alternatives: Editing director source or shared roadmap docs would violate the explicit write scope. Adding hooks only as a short section in `integration_contract.md` would bury the actual beat table and make implementation ambiguous.

Scalability potential: Low uses 4-6 beats and one-shot effects; Middle uses the full beat table; High links cross-expansion scarcity; Ultra spends saved CPU on visual archive/paper/speaker presentation, not heavier logic.

Hardware Impact: 0 us/frame in this documentation pass. Future runtime design targets rare-tick or interaction-bound execution, preserving weak i3/MX350 class devices while allowing visual overkill on high-end machines.

## Decision 2: Director Effects As Requests

Problem: Director can easily become a hidden god that mutates documents, access and archive state outside EXP03 ownership.

Solution: Defined effects as requests into future document/access/archive helpers: mutate one document, override one next archive query, raise one next checker suspicion, or offer one legal route. Adapter failure records trace and should consume no cooldown.

Rejected Alternatives: Direct director mutation of inventory, rooms or floor state was rejected because it breaks EXP03 access contract, creates dependency on missing code and risks untraceable behavior.

Scalability potential: Low keeps effects one-shot and local. Middle adds suspicion and lockdown. High adds chain payloads. Ultra improves presentation only.

Hardware Impact: Single-target effect selection avoids inventory-wide scans and keeps future work near 0 us/frame except at director rare tick or interaction.

## Decision 3: Archive Corruption Must Be Labeled

Problem: Archive misinformation can feel like a bug if the player and debug tools cannot distinguish official, stale, warped or future-dated results.

Solution: Director archive beats set explicit `ArchiveCard.reliability` states and write trace payloads with query keys and reason codes.

Rejected Alternatives: Randomly changing card contents without reliability metadata was rejected because it would produce unverifiable failures and violate the black-box mandate.

Scalability potential: Low supports one stale/future flag. Middle supports bounded corruption. High links cards to cross-expansion clues. Ultra adds visual corruption and DATA effects.

Hardware Impact: Reliability is a small enum/state field. Estimated overhead remains interaction-only and effectively 0 us/frame.

## Decision 4: Cross-Expansion Chains Store Minimal Payloads

Problem: EXP03 must connect to metro, market, hospital, mushroom and VOID chains without depending on foreign code that may not exist yet.

Solution: Defined chain slots with small payloads: chain id, step index, source beat, expiry and one access tag or archive query key. Missing foreign expansion means the slot is not registered.

Rejected Alternatives: Importing or naming foreign runtime modules was rejected because 20+ agents may be editing independently and the prompt forbids invented direct dependencies.

Scalability potential: Low disables chains; Middle enables two slots; High links multiple scarcity tags; Ultra expands only visible clue presentation.

Hardware Impact: Chain state is bounded and tiny. Future runtime cost is rare-tick only, not per-frame.
