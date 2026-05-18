# Rationale_EXP09_404

Date: 2026-05-17  
Scope: documentation planning for Expansion 09: Elevator Loop 404.

## Decision 1 - 404 As The Only Playable MVP

Problem: Numbered floors can sprawl into a list of jokes, enum churn and unfinished pockets before any playable loop exists.

Solution: Specify `404` as the single full MVP. `556`, `777` and `1337` receive stable defs, debug labels and fallback validation only. The first proof is entry, local rule, exit and consequence for 404.

Rejected Alternatives: Implementing four playable numbered floors at once was rejected because it multiplies generator, save/load and content risk. Adding a permanent numbered `FloorLevel` was rejected because project docs require pocket proof before large floor growth.

Scalability potential: Low runs one 5-room 404 pocket. Middle adds four defs and samosbor bias. High links archive/rumor/world-log hooks. Ultra spends visual budget on distinct numbered atmospheres after the finite instance system is proven.

Hardware Impact: On low-end silicon such as i3/MX350, inactive cost is specified as 0 us/frame. Avoided cost versus naive multiple-floor simulation is roughly 100-1000 us/frame depending on pathfinding/NPC/render load that is not created.

## Decision 2 - `NumberedFloorDef` Plus One Active `floorInstance`

Problem: Permanent enum floors would create save/load, generator and integration churn across parallel agents.

Solution: Use data-driven `NumberedFloorDef` and a runtime `FloorInstanceState` with one active numbered instance in MVP. Store seed, flags, claimed rewards and last stable floor/position; generate pocket from seed and close it on exit.

Rejected Alternatives: Serializing full generated pocket cells as permanent world data was rejected for MVP because the pocket is temporary and small. Multiple simultaneous instances were rejected because they create nested-fallback and debug complexity without player value.

Scalability potential: Low supports 404 only. Middle supports additional defs. High can allow selected persistent deltas if later justified. Ultra can add richer visuals per def while keeping the same finite state.

Hardware Impact: Instance creation is rare and bounded at target 100-300 us middle tier. Runtime inactive remains 0 us/frame. Save payload stays small and cheap to normalize.

## Decision 3 - Map Lies, Collision Does Not

Problem: 404 requires broken-map horror, but if collision/pathfinding truth changes, the player will report a bug and QA cannot reason about it.

Solution: Distort labels, markers and minimap interpretation only. Physical space, doors, collision and exit ids stay deterministic. Clues teach the player that the map is the wrong witness.

Rejected Alternatives: Randomly changing walls, hiding collision or moving exits after player observation was rejected because it creates unfair softlocks and undermines deterministic testing.

Scalability potential: Low changes a label and marker. Middle adds wrong door plaques and chimes. High adds repeated room motifs. Ultra adds HUD contradiction/noise effects inside the pocket only.

Hardware Impact: Label/marker distortion is applied on map/HUD query, not global world update. Expected cost is negligible and event/UI-bound; avoids dynamic pathfinding invalidation entirely.

## Decision 4 - Elevator Anomaly On Interaction/Event Cadence

Problem: A naive anomaly system could poll every frame or turn elevators into random teleports.

Solution: Resolve anomalies only when the player uses an elevator, a scripted lift transition occurs, or debug rolls the resolver. The result includes warning ids, reason ids and deterministic chance from request seed and conditions.

Rejected Alternatives: Per-frame lift anomaly polling was rejected for cost and unpredictability. Hidden random teleport was rejected because it looks like a broken transition.

Scalability potential: Low supports debug force and one clue. Middle adds samosbor variants. High consumes optional rumor/document sources. Ultra adds visual/audio warning channels without changing resolver math.

Hardware Impact: Idle cost is 0 us/frame. Entry resolve target is <100 us low tier and remains a rare event. This avoids continuous lift scans across the 1024x1024 world.

## Decision 5 - Save/Load Fallback Before Content Ambition

Problem: Temporary floors are dangerous if saves can strand the player in missing generated content after version changes.

Solution: Serialize last stable floor/position before entry and normalize on load. If def or generator is missing, close the instance and return player to stable coordinates with a reason-coded event/debug message.

Rejected Alternatives: Failing load, spawning at origin or silently dropping player into a default floor was rejected because all three destroy trust and debugging evidence.

Scalability potential: Low only restores or falls back 404. Middle tests missing defs. High logs normalization into world events. Ultra can show diegetic recovery text, but the mechanical fallback stays the same.

Hardware Impact: Load normalization is one-time and small. Avoids expensive emergency searches for valid coordinates in generated pockets and prevents support/debug time loss.

## Decision 6 - Optional Cross-Expansion Hooks

Problem: EXP09 naturally wants metro wrong exits, archive documents, market lost-item recovery and void protocol meaning, but those are separate owners.

Solution: Define optional hooks with disabled/fallback behavior. EXP09 works through elevator + local docs by itself. Missing optional providers do not break build or save.

Rejected Alternatives: Importing future EXP02/EXP03/EXP05/EXP10 files or assuming their ids exist was rejected under the parallel-agent constraint.

Scalability potential: Low is standalone. Middle consumes generic rumors. High links archive/market/metro when present. Ultra adds cross-expansion presentation, not hard dependencies.

Hardware Impact: Optional hook checks happen on entry, reward or exit events. No per-frame polling. Missing hooks fail closed with debug-visible reason.

## Decision 7 - One-Shot Lost Item Recovery

Problem: A floor that returns lost items can become a farm or a way to duplicate high-tier gear.

Solution: Lost storage can recover one bounded low/mid item per instance or give a false item/document instead. Claimed reward ids are stored in instance state.

Rejected Alternatives: Full inventory restoration was rejected because it removes survival pressure. Unlimited merchant recovery was rejected because it converts anomaly horror into a convenience shop.

Scalability potential: Low gives one document. Middle allows one low/mid item. High hooks black market pricing. Ultra adds Bella 404 presentation later, still bounded.

Hardware Impact: Reward selection is interaction-only and checks a small recent-lost list. Estimated cost is tens of microseconds, not frame-bound.

