# LOG DIRPASS_EXP09

## 2026-05-17 - Director-hook pass for Expansion 09

What was wrong: `Docs/Expansions/09_elevator_loop_404` defined numbered floors, 404 pocket content, elevator anomaly contracts and save/load safeguards, but it had no explicit contract for the Samosbor Director. Without that, future implementation could either ignore 404 pacing or hardwire director behavior into elevator/floor systems.

What was done: Created `Docs/Expansions/09_elevator_loop_404/director_hooks.md` as an implementation-ready director contract. It defines a compact EXP09 signal provider, anomaly-prep beats, wrong-marker beats, 404 entry beats, debug entry, exit backlash, relief stabilization, stub-only 556/777/1337 hints, typed conditions, adapter effects, chain slots, trace payload, debug validation, failure behavior and performance tiers.

What was done: Updated local `integration_contract.md` with a `Director Integration` section. The section states that director can pace anomaly prep, wrong marker, pocket entry and exit backlash, but cannot create floors, alter collision/pathfinding, mutate inventory, scan the world or enter stub pockets.

Cinematic cheats used: blank elevator indicator, wrong chime count, paperwork denial, one wrong map marker, false-floor memory and visible stable-return confirmation. These replace elevator-route simulation, live cartography corruption, NPC-wide amnesia and persistent numbered-floor worlds.

Exact microseconds saved: steady-state director cost remains 0 us/frame by contract. Avoided full lift/room/NPC/item scans saves unbounded per-frame work, estimated as thousands of microseconds on weak hardware if implemented naively. Intended event costs are bounded: 10-50 us for prep/marker beats, 20-80 us for entry requests, 10-40 us for exit backlash, 0 us while inactive.

Validation: Docs-only pass. No TypeScript compile was run because no source files were edited. Readback verified that entry requires prep/warnings, wrong markers do not alter collision, stub pockets remain blocked, missing adapters degrade to typed rejection, and debug can prove each phase.
