# Rationale_EXP07_HOSPITAL

## Decision 1: Registry Missing, Mandates Still Applied

Problem: The instruction required reading `.agents-skills/`, but `/Users/jirnyak/Mirror/gigahrush/.agents-skills` does not exist in this checkout.

Solution: Used direct filesystem evidence, recorded the absence, and applied relevant mandates from the provided instruction block and project docs: domain boundary, simultaneous execution, finite bounded state, cinematic cheat, frame-time dictatorship, Math LOD, Black Box and file-based reporting.

Rejected Alternatives: Inventing mandate names would be fake compliance. Continuing silently was rejected because missing registry evidence affects authorization and later audit.

Scalability potential: Low devices get player/key-NPC conditions only. Middle adds room flags and sanitar checks. High links records to economy/events. Ultra spends saved cycles on wet tile, lamp flicker, gurney silhouettes and audio, not broader disease simulation.

Hardware Impact: On i3/MX350-class hardware, bounded condition arrays and room flags avoid world infection scans. Expected saving versus per-cell contagion is hundreds to thousands of microseconds during large-map updates.

## Decision 2: Hospital MVP As LIVING Pocket, Not New Floor

Problem: Expansion 07 has a hospital fantasy, but the expansion index says MVP must prove a loop before any large permanent floor.

Solution: `implementation_plan.md` locks the MVP to a compact hospital quarantine pocket between `LIVING` and `MINISTRY`, implemented later through existing room/zone content patterns. `FloorLevel.HOSPITAL` is reserved only after the condition loop, quarantine gate and medcard consequences work.

Rejected Alternatives: A full hospital floor would multiply generation, save/load, NPC schedule and navigation scope before the mechanics are proven. A single decorative medroom was also rejected because it would not satisfy input-risk-decision-result-consequence.

Scalability potential: Low has one pocket and one active room flag. Middle adds quarantine rooms and two staff checks. High adds records/event consumers. Ultra adds dense visuals while logic remains local.

Hardware Impact: One pocket keeps runtime idle cost near zero. Active medical checks target 20-80 us on weak hardware, with debug formatting excluded from frame-critical paths.

## Decision 3: Finite Conditions Instead Of Disease Simulation

Problem: Medical gameplay can become an expensive and annoying simulation if infection spreads cell by cell or every NPC carries complex health state.

Solution: `integration_contract.md` defines finite `MedicalConditionId`, bounded active condition slots and rare decay ticks. Conditions are applied by explicit causes and room/NPC interactions, not diffusion.

Rejected Alternatives: Real contagion grids, continuous body-part damage, per-frame vitals and probabilistic pathogen models were rejected. They do not buy survival-horror decisions proportional to their cost.

Scalability potential: Low uses player plus named NPC slots. Middle includes key patients. High lets economy and access systems react to condition tags. Ultra adds richer HUD/audio/room presentation without increasing condition complexity.

Hardware Impact: Bounded arrays give deterministic O(n) over a tiny n. Expected per medical tick cost is under 40 us for the player and a small named-NPC set, compared with millisecond-scale world scans.

## Decision 4: Quarantine As Access State And Event, Not Global Contagion

Problem: Quarantine must change routes and social access without consuming the whole map or blocking other agents.

Solution: Quarantine is modeled as flags on player/NPC/room records plus rare events such as `hospital_quarantine_started`, `sanitar_check_failed` and `room_service_blocked`. Doors and services query the flag through an adapter.

Rejected Alternatives: Spreading quarantine through all rooms, locking entire floors or replacing faction logic was rejected because it would hijack global systems and create cross-agent conflicts.

Scalability potential: Low: one service gate. Middle: room isolation and sanitar dialogue. High: market/metro/school access consequences. Ultra: more audiovisual feedback and record corruption, same finite flags.

Hardware Impact: Flag checks are negligible, estimated under 5 us per interaction. Avoiding path-wide quarantine propagation saves unpredictable spikes on weak CPUs.

## Decision 5: Morgue As Record Archive With Strict Loot Budget

Problem: The morgue must be frightening and useful without becoming a free stash of medicine or a generic combat arena.

Solution: `content_manifest.md` treats the morgue as an archive of body tags, wrong medcards, death records and limited evidence. Loot is capped by manifest budget and biased toward documents, keys and rare story traces.

Rejected Alternatives: Zombie-wave morgue, unlimited pills, random chest room and gore-first description were rejected because they flatten the hospital into generic horror and break survival economy.

Scalability potential: Low: two slab records and one wrong document. Middle: event-linked body tags. High: record conflicts with archive/raionsovet. Ultra: body drawer visuals and audio, still capped loot.

Hardware Impact: Static records and fixed loot lists have no continuous runtime cost. Record lookup should be table-based and under 10 us per interaction.

## Decision 6: Save/Load Tolerance Before Rich Features

Problem: Future medical state will touch player status, NPC records, room flags and documents. Old saves must not break when those optional fields appear.

Solution: Contract requires versioned `MedicalSaveV1`, optional fields, unknown-id quarantine, clamped severity/progress and normalization on load. The absence of `medical` means no active conditions.

Rejected Alternatives: Required save fields and hard enum assertions were rejected because they turn content additions into save-breaking changes. Silent discard was rejected because it hides corrupted medical states.

Scalability potential: Low saves only active player conditions. Middle adds patient/room records. High/ultra can add record metadata as optional arrays without invalidating older saves.

Hardware Impact: One load-time normalization pass is outside the frame budget. Runtime access remains fixed and tiny.

## Decision 7: Documentation-Only Work Keeps Forbidden Files Untouched

Problem: The user explicitly forbade code, README, desdoc, root expansion, index and other expansion folders.

Solution: Created only `implementation_plan.md`, `content_manifest.md`, `integration_contract.md`, `Status_EXP07_HOSPITAL.md`, `Rationale_EXP07_HOSPITAL.md` and `LOG_EXP07_HOSPITAL.md` inside the allowed scope.

Rejected Alternatives: Updating `Docs/Expansions/INDEX.md` or implementing TypeScript would violate scope and risk collisions with other concurrent agents.

Scalability potential: Clean scoped docs let future implementers split data, systems and content work without cross-agent merge damage.

Hardware Impact: No runtime impact because no code changed.
