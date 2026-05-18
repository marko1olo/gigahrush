# Rationale DIRPASS_EXP09

## Decision 1: 404 entry requires prep and warning beats

Problem: A numbered floor can look like a broken elevator transition if the director sends the player into 404 without prior evidence.

Solution: `director_hooks.md` splits the flow into anomaly prep, wrong marker, pocket entry and exit backlash. Entry beats require a prior clue, warning, map contradiction or route-error chain signal. The director may arm an entry window, but EXP09 still validates through elevator anomaly and floor-instance adapters.

Rejected Alternatives: Direct director force-entry from a rare tick was rejected because it hides causality and bypasses EXP09 fallback validation. Random elevator misdelivery without warning was rejected because it violates the local countermeasure against "fake bug" presentation.

Scalability potential: Low uses one blank indicator and one readable clue. Middle adds wrong chime and map contradiction. High connects metro/archive route-error chains. Ultra improves display, chime and paper presentation while keeping the same finite logic.

Hardware Impact: Steady impact is 0 us/frame. Entry preparation is rare tick or elevator-interaction work, estimated under 50 us on weak devices for selection and under 100 us for resolver-side use.

## Decision 2: Wrong markers are visual contracts, not world mutation

Problem: EXP09 needs the map to lie without corrupting collision, pathfinding or the player's trust in the game.

Solution: Marker beats can arm one bounded label, arrow or minimap contradiction with an expiry and a physical clue. The contract explicitly forbids changing collision, doors, coordinates or pathfinding truth. Debug must print the marker id and physical clue.

Rejected Alternatives: Altering geometry or moving exits was rejected because it risks save/load and pathing failures. Disabling all orientation was rejected because the 404 rule must be solvable through physical clues.

Scalability potential: Low uses one wrong label. Middle adds map policy telemetry. High/Ultra can add stronger HUD-map contradiction and room props without extra simulation.

Hardware Impact: One marker flag plus debug trace is effectively 0 us/frame outside rendering of an already visible map/HUD element. It avoids any per-frame spatial search.

## Decision 3: Director effects are adapter requests, not numbered-floor ownership

Problem: The Samosbor Director must pace EXP09 without becoming a second floor-instance or elevator-anomaly system.

Solution: Effects are narrow requests: reserve warning, seed clue, arm marker, arm entry window, request instance entry, apply memory mark, publish aftermath, stabilize return lift or trace-only fallback. EXP09 remains owner of instance creation, exit rules, rewards, map policy and save/load normalization.

Rejected Alternatives: Putting instance creation, reward grants or anomaly chance math directly in director beats was rejected because it duplicates EXP09 systems and creates cross-agent compile coupling.

Scalability potential: Low can implement only 404 adapters. Middle adds stub clues. High adds optional metro/archive/market/rumor/void signals. Ultra does not increase logic scale.

Hardware Impact: Missing adapters reject early with typed reasons. Present adapters run only on rare tick, elevator interaction or aftermath event, preserving 0 us/frame idle cost on i3/MX350 class hardware.

## Decision 4: Stub numbered floors remain clue-only

Problem: The EXP09 package reserves 556, 777 and 1337 but only 404 is playable in the MVP.

Solution: Stub beats surface documents or hints only and must prove `beginFloorInstance()` remains blocked for non-playable defs. Trace uses `nonplayable_stub` or missing-signal reasons instead of silent failure.

Rejected Alternatives: Allowing director to route into stub pockets was rejected because it would create fake content, softlocks or enum pressure. Removing the stubs from director visibility was rejected because future chains need stable ids.

Scalability potential: Low ignores stubs. Middle exposes one clue per stub. High and Ultra can later convert each stub to playable by changing the def/provider state without changing chain ids.

Hardware Impact: Stub hints are single document/rumor rows on rare ticks. They add no active simulation and no hot-path cost.

## Decision 5: Exit backlash is bounded aftermath, not repeated punishment

Problem: 404 needs consequences after exit, but repeated anomalies can turn a legend into commute noise or pressure spam.

Solution: Exit beats are separate from entry beats. Successful exit can apply one false-floor memory mark. Bad exit can publish a warning and block immediate re-entry. Relief can stabilize one return lift when relief budget is available.

Rejected Alternatives: Re-entering 404 immediately after a bad exit was rejected because it can loop-punish the player. Complex NPC amnesia simulation was rejected because the content manifest only calls for short flags/rumors.

Scalability potential: Low uses one memory enum and one warning. Middle adds rumor/memory integration. High chains aftermath into archive/market/void. Ultra spends budget on better lines and audio, not more state.

Hardware Impact: Aftermath is event-bound and stores small flags or trace entries. No NPC-wide scan is required.
