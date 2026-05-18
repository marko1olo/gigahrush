# AG15 Black Market 88 Rationale

## Preflight

Problem: The existing game had black-market atmosphere through "Толкучка", but the requested loop needs debt, scarcity, stolen stock, contract offers, and faction risk without adding a market simulator.

Solution: Keep AG15 as additive content. Use a new living-zone content module, the existing side-quest registry, existing `ContractDef` conversion to `Quest`, existing economy scarcity helpers, and existing container theft events.

Rejected Alternatives: A second quest runtime, live market prices, per-frame buyer simulation, or rewriting NPC trade. Those would violate project architecture and add runtime cost for behavior that can be expressed through rooms, NPCs, containers, quests, and events.

Performance Impact: Expected steady-frame cost is 0 us. The room is stamped during generation, contract reward adjustment runs only when a contract is offered, and theft consequences reuse explicit container interaction events.

## Implementation Plan

- Add `src/gen/living/black_market_88.ts` as a self-contained hidden debt counter.
- Import it from the living content manifest.
- Register five market NPC definitions and five bounded side quests.
- Seed market containers with scarce medicine, fake documents, and a faction-owned audit crate that triggers existing theft events if looted.
- Add black-market `ContractDef` entries and a narrow scarcity reward helper.
- Add rumors pointing players toward the hidden counter and the risky crate.

## Implementation Notes

Problem: Hand-placed market containers are created before the generic container seeding pass. The old container seeder returned early whenever any container existed, which would make one custom market room suppress normal room containers across the floor.

Solution: Keep the same cap and lazy creation path, but let `ensureRoomContainers()` rebuild maps, skip rooms that already have containers, and continue seeding other rooms until the cap is reached.

Rejected Alternatives: Spawning market stock as loose item drops or adding a second container registry. Loose drops would not produce theft events; a second registry would duplicate AG10 container behavior.

Problem: Contract rewards need to read scarcity without adding live market simulation.

Solution: Added `rewardResourceId` / `rewardScarcityMax` to `ContractDef` and a helper in `systems/economy.ts`. Contract creation reads the resource only when a contract is offered; no per-frame market loop was added.

Rejected Alternatives: Recomputing all open contract rewards every tick or storing market state in the generator. Both would add runtime churn for a bounded offer-time decision.
