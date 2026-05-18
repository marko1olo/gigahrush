# Rationale_EXP01_MUSHROOM

Agent: EXP01_MUSHROOM  
Domain: Expansion 01 Mushroom Shift  
Date: 2026-05-17

## Decision 1: MVP stays in existing floors

Problem: The expansion concept includes HYDROPONICS, but the expansion index and source design require an MVP before any large new floor. A new `FloorLevel` would create cross-agent conflicts in generation, navigation, saves, minimap, and floor switching.

Solution: Define the first playable slice across `LIVING`, `MAINTENANCE`, `KVARTIRY`, and an existing market/trader hook. The player gets the production loop without global floor surgery.

Rejected Alternatives: Creating `FloorLevel.HYDROPONICS` immediately was rejected because it depends on shared enum, generator, renderer/map, elevator, save/load, and content ownership. Building a decorative single room was rejected because it would not satisfy the input-risk-result-consequence loop.

Scalability potential: Low tier gets one cellar and lazy farm tick. Middle tier gets several farms. High tier adds faction pressure and contracts. Ultra tier gets a hydroponics pocket with denser visuals while reusing the same room-state system.

Hardware Impact: On low-end silicon such as i3/MX350, avoiding a new floor and world-scale generation keeps runtime impact effectively near zero until the player interacts with the farm. Estimated ordinary MVP farm tick target remains below 0.1 ms, with most frames at 0 us because no farm tick runs.

## Decision 2: Farm as room-level state, not entities

Problem: Individual mushroom entities would multiply rendering, update, interaction, save, and pathing work while adding little decision value.

Solution: Specify `MushroomFarmState` as compact room state: strain, phase, humidity, contamination, owner, last tick, and mutation flag. Visual richness is delegated to room features, texture swaps, sprites, HUD logs, documents, and sounds.

Rejected Alternatives: Per-tile mold simulation and airborne spore particles were rejected as expensive fake biology. A purely item-based farm was rejected because it hides room state and makes samosbor reactions hard to explain.

Scalability potential: Low uses one state object and one visual marker. Middle tracks contamination/humidity per farm. High adds faction ownership and raids. Ultra adds denser room clusters but still one state per farm room.

Hardware Impact: Room-level state changes work from O(tiles or entities) to O(active farms due for tick). On i3/MX350 the expected gain versus entity simulation is full avoidance of per-frame farm cost; estimated saved time is 100-500 us in dense rooms compared to naive sprite/entity updates.

## Decision 3: Structured events with local fallback

Problem: Project docs point toward world events, rumors, memory, economy, and production, but parallel agents may be implementing those systems simultaneously. Direct imports would create fragile dependencies.

Solution: Define stable mushroom event IDs and event payload expectations, but require an adapter. If global events exist, publish facts. If absent, use HUD/log messages and a bounded local farm event ring for debug.

Rejected Alternatives: Blocking Mushroom Shift until event bus completion was rejected because it stalls the MVP. Implementing a private global event bus inside the expansion was rejected because it duplicates shared architecture and breaks future integration.

Scalability potential: Low uses local debug facts. Middle forwards to journal/rumors. High feeds economy and contracts. Ultra uses the same event facts for hydroponics pocket, raids, and multi-zone supply.

Hardware Impact: Bounded event emission on state transition avoids per-frame context reconstruction. On i3/MX350 this should save roughly 50-200 us during crowded NPC frames compared to scanning for reactions.

## Decision 4: Content IDs before code

Problem: Multiple future systems need to talk about the same rooms, NPCs, items, documents, and events. Without stable IDs, implementers will create near-duplicates.

Solution: `content_manifest.md` defines proposed IDs for rooms, NPCs, items/resources, strains, documents, events, quest beats, and debug commands. The contract still requires live code inspection before enum or registry edits.

Rejected Alternatives: A prose-only content list was rejected because it cannot be wired safely. Hardcoding names inside future room generators was rejected because it prevents data-driven validation and later localization/registry checks.

Scalability potential: Low/MVP consumes only required IDs. Middle and high unlock optional/deferred entries. Ultra reuses the same IDs and strain registry in the hydroponics pocket.

Hardware Impact: ID-driven lookup has no meaningful runtime cost if resolved through existing registries. It prevents duplicated data and reduces asset/content churn; estimated runtime impact is 0-10 us outside debug validation.

## Decision 5: Debug commands are part of MVP

Problem: A slow growth system is difficult to test manually. Without debug controls, balancing devolves into waiting or guessing.

Solution: Require commands for spawning a farm, giving the MVP kit, advancing phase, forcing wet/meat effects, spoiling, harvesting, dumping farm state, and cycling LOD.

Rejected Alternatives: Testing only through normal gameplay was rejected because it is too slow and hides failures. A separate debug UI was rejected because the project already has a debug system owner.

Scalability potential: Low validates one farm. Middle profiles several farms. High tests faction/contract reactions. Ultra stress-tests dense pocket visuals and farm state without changing gameplay code.

Hardware Impact: Debug commands run on demand and do not affect normal frames. The farm dump must avoid hot-path allocation; expected runtime impact in normal play is 0 us.

## Decision 6: Math LOD uses four tiers

Problem: The supplied rules explicitly forbid a weak/ultra-only dichotomy. The design must scale across weak, middle, high, and ultra hardware.

Solution: The plan defines low, middle, high, and ultra behavior for simulation, visuals, and social/economy integration. The cheap approximation remains valid gameplay, while higher tiers spend saved cycles on atmosphere and consequences.

Rejected Alternatives: A single balanced middle-ground design was rejected because it fails both toaster and high-end requirements. Pure graphics toggles were rejected because simulation cadence and social systems also need scaling.

Scalability potential: Low is one lazy farm. Middle is several farms and local prices. High is factional pressure and richer events. Ultra is hydroponics pocket visual overload with the same bounded state.

Hardware Impact: Low tier avoids continuous simulation and should keep farm overhead near 0 us on most frames. Ultra spends budget on extra visuals and events but remains bounded by active farm count rather than world size.

## Decision 7: No compile run for docs-only pass

Problem: The task changes markdown only. Running `npm run build` would test unrelated TypeScript code possibly being changed by other agents and could produce noise outside EXP01 responsibility.

Solution: Verify changed file scope and document that compile was not run because no runtime files changed. Future implementation phases require `npm run build` after code changes.

Rejected Alternatives: Running build as a symbolic gesture was rejected because a failure could belong to another concurrent agent and would not validate markdown. Ignoring verification entirely was rejected, so file-scope verification is required.

Scalability potential: The decision keeps documentation work decoupled. Runtime implementation phases still have strict build and debug verification.

Hardware Impact: No runtime impact. Avoids spending local build time on a docs-only pass; estimated saved wall time is seconds, frame-time relevance 0 us.
