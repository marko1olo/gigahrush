# Rationale_DIRPASS_EXP02

## Decision 1: Separate `director_hooks.md` Instead Of Expanding The Old Contract Into A Wall

Problem: EXP02 already had an integration contract for route runtime, floor-instance hooks, debug and save/load. The director pass needs scheduling semantics, cooldowns, chain slots and trace validation without burying the existing route contract.

Solution: Create `Docs/Expansions/02_metro_error_line/director_hooks.md` as the implementation-ready director surface and add a short Director Integration Contract section to the local `integration_contract.md` pointing future implementers to that file.

Rejected Alternatives: A short bullet list in the existing contract was rejected because it would not encode conditions/effects/debug validation. A full rewrite of `integration_contract.md` was rejected because it would churn existing EXP02 ownership text and increase conflict risk.

Scalability potential: Low tier can register only essential route/closure/wrong-exit beats; middle/high/ultra can add richer presentation and chain consumers without changing the route contract.

Hardware Impact: No runtime cost now. Future runtime keeps director evaluation at 0 us/frame steady-state and spends only rare-tick/event-bound microseconds.

## Decision 2: Treat Wrong Exit As A Two-Step Director Chain

Problem: A director-forced wrong exit can feel like a bug or hidden punishment if it changes destination without prior evidence.

Solution: Require `exp02.metro.warning_stack_wrong_exit` before `exp02.metro.force_depot_wrong_exit`. The wrong-exit beat needs route warning ids, a deterministic transit seed, a valid depot fallback and expected/actual destination trace.

Rejected Alternatives: Directly overriding arrival on a high-risk route was rejected because it violates predictability and debug trust. Sending the player to future 404 by default was rejected because EXP09 may be absent.

Scalability potential: Low uses depot as the only controlled wrong-exit target. Middle adds red pocket warnings. High/Ultra can let Archive/404 consume the aftermath chain after their providers exist.

Hardware Impact: Low-end i3/MX350 cost stays event-bound, roughly 20-60 us at arrival, 0 us/frame. High-end machines can spend saved cost on announcements, flicker and tunnel fakes.

## Decision 3: Station Closure Must Never Trap The Player

Problem: Samosbor-driven station closure is valuable pressure, but closing the only known exit can soft-lock the player or convert metro into unfair fast-travel denial.

Solution: Add `metro_station_can_close_safely(stationId)` and explicit validation that closure beats need a fallback/return route or must reject with `metro_station_would_trap_player`.

Rejected Alternatives: Allow all closures and rely on future level design was rejected because director scheduling happens at campaign level and must be safe without room-specific knowledge. Keeping closures cosmetic only was rejected because station closure is one of EXP02's core director beats.

Scalability potential: Low closes only one route and preserves return. Middle/High can apply samosbor/faction variants. Ultra can add visual overkill without more routing logic.

Hardware Impact: Closure validation is a tiny route-state check on samosbor/director event, estimated 10-35 us, 0 us/frame.

## Decision 4: Cross-Expansion Links Use Chain Slots, Not Imports

Problem: Metro naturally points to Archive, 404, HELL, hospital and market, but this pass runs beside other agents and cannot depend on their unfinished modules.

Solution: Define named chain slots with payload ids (`wrong_exit[2]`, `route_red[0]`, `relief[0]`) and require missing optional consumers to reject/fallback with trace reason `missing_signal_provider`.

Rejected Alternatives: Direct target ids from other expansions were rejected because they would create brittle dependencies. Removing cross-expansion references was rejected because the director's value is campaign linkage.

Scalability potential: Cheap devices can ignore optional consumers and use local depot/document fallback. Higher tiers can activate more chain consumers as they register, with no change to EXP02 route runtime.

Hardware Impact: Chain slot bookkeeping is rare-tick metadata only. Expected low-end impact is below 10 us on relevant director ticks, 0 us/frame.

## Decision 5: Director Effects Are Adapter Calls, Not Route Data Mutation

Problem: A campaign director that mutates route definitions directly can corrupt deterministic route behavior, save/load and debug risk reporting.

Solution: Director effects are constrained to reveal hints/routes, reserve warnings, apply bounded risk modifiers, close stations, override active destination, seed documents, publish events and prime chain slots. Every effect returns a reason-coded result.

Rejected Alternatives: Letting director edit `MetroRouteDef` tables was rejected because it would mix content definition with campaign state. Letting debug commands own route logic was rejected because debug must only call metro APIs.

Scalability potential: Low tier uses few modifiers; middle/high/ultra can stack presentation and chain context while preserving stable route ids and deterministic resolution.

Hardware Impact: Event-bound adapter calls are estimated 10-60 us depending on effect, with no per-frame scanning or allocation requirement.
