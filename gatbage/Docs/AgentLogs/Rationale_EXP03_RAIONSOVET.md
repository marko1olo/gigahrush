# Rationale_EXP03_RAIONSOVET

Agent: EXP03_RAIONSOVET  
Date: 2026-05-17  
Domain: Expansion 03, Райсовет и Живой архив

## Decision 1: Keep MVP Inside MINISTRY

Problem: `desdoc.md` contains ADMIN and Райсовет concepts, but the current expansion and index require MVP without a new large floor. Adding `FloorLevel.ADMIN` would create cross-agent enum, generator, save and navigation dependencies.

Solution: Specify all MVP rooms as `MINISTRY` content pockets: queue, permit bureau, stamp room, living archive and checker post. Late `ADMIN` may import this contract after a separate room/pocket proof.

Rejected Alternatives: Standard Unity-style or large-RPG approach would add a whole administrative level first. Too slow, too many integration points, and it violates the current expansion boundary.

Scalability potential: Low uses static rooms and interaction checks; Middle adds suspicion and expiry; High attaches events and faction modifiers; Ultra spends saved cycles on DATA/archive visuals without changing floor topology.

Hardware Impact: On low-end silicon such as i3/MX350, avoiding a new floor generator and global simulation saves all frame-time cost until the player enters a room. Estimated runtime gain: effectively 0.05-0.20 ms per frame versus any naive persistent admin simulation.

## Decision 2: Data-Driven Documents With Stable IDs

Problem: Documents must affect access, prices, suspicion and archive results. If they are just strings in dialogue, no shared system can verify them.

Solution: Define immutable `DocumentPermitDef` records and compact `DocumentInstance` records. Checks reference `defId` and `accessTags`, not display text.

Rejected Alternatives: Title-based checks such as searching for "propusk" in item names. This is brittle, localization-hostile and impossible to debug under samosbor mutations.

Scalability potential: Low stores eight defs; Middle adds expiry/forgery; High adds faction effects; Ultra adds visual paper degradation. The same ids work across all tiers.

Hardware Impact: Tag/id lookup at interaction time is bounded and should stay under 20 microseconds for a small player inventory. No per-frame allocations required.

## Decision 3: Unified Access Function

Problem: Doors, guards, containers, archives and quests need the same permission logic. Separate room scripts would diverge and create bugs that look like content problems.

Solution: Specify `AccessCheckRequest` and `AccessCheckResult` as a pull-based helper. Callers supply required tags and context; the helper returns allow/deny reason, suspicion delta and event intent.

Rejected Alternatives: Embedding checks inside each generator module. This is the standard quick approach and it fails once forged, expired or warped documents exist.

Scalability potential: Low checks only tags; Middle checks suspicion and expiry; High checks world facts and faction modifiers; Ultra adds local visual inspection effects. The call shape does not change.

Hardware Impact: Single interaction check avoids polling. Estimated gain over naive guard polling: 0.03-0.10 ms per frame in populated ministry scenes on i3/MX350.

## Decision 4: Archive As Bounded Lookup, Not Omniscient Database

Problem: A "living archive" can easily become a global database scan over NPCs, events and quest state. That is expensive and destroys uncertainty.

Solution: Archive queries return bounded `ArchiveCard` summaries from known facts, quest ids, optional important world events and static records. Last known zone is aggregated; exact coordinates are excluded.

Rejected Alternatives: Real-time search of all NPCs and events on every query. Too slow, too revealing, and incompatible with horror ambiguity.

Scalability potential: Low uses static cards; Middle adds stale/warped reliability; High reads important events and NPC memory; Ultra visualizes DATA ghosts and broken records. Logic remains lookup-based.

Hardware Impact: Interaction-only archive query should be invisible to frame time. Avoiding global scans saves spikes that could exceed 0.1 ms on low-end CPUs.

## Decision 5: Samosbor Mutates Flags, Not Physics

Problem: Documents must be vulnerable to water, false orders and broken seals, but physical paper simulation is wasteful.

Solution: Represent document damage with flags: `warped`, `wet`, `stamp_damaged`, `false_order`, `stale_archive`. Mutation occurs at samosbor end, room entry or first post-event inspection.

Rejected Alternatives: Simulate paper condition, humidity or stamp ink continuously. It buys no gameplay beyond a cheap state flag.

Scalability potential: Low disables mutation except scripted; Middle applies two mutation rules; High ties variants to events; Ultra adds visual overlays and archive glitches.

Hardware Impact: Flag mutation is O(number of relevant documents) on rare triggers. Expected per-frame cost: 0 us. This preserves frame budget for visuals and AI.

## Decision 6: Debug And Black Box Are Part Of MVP

Problem: Access denial, forged document detection and archive corruption are easy to misread as bugs. Without telemetry, failures will be untraceable under multi-agent changes.

Solution: Require debug commands and a 300-entry fixed-size telemetry contract for document/access/archive decisions. Future runtime dump target: `Docs/AgentLogs/Dump_EXP03_RAIONSOVET.bin`.

Rejected Alternatives: Console-only logging. It is not bounded, not user-visible in gameplay, and not acceptable evidence for final integration.

Scalability potential: Low shows last N decisions; Middle includes suspicion and flags; High includes event ids; Ultra can render archive-machine traces from the same telemetry.

Hardware Impact: Fixed ring buffer write per interaction is effectively free compared with string logging. Estimated gain over console logging during debug: avoids millisecond-scale stalls.
