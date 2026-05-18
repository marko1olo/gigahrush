# AG27 Main Plot Next Chain Log

## Session Start

What was wrong: The main plot ended at Major Grom sending the player into Hell, while older helper code created hidden virtual Herald/Creator quests outside `PLOT_CHAIN`.

What was done: Preflight completed, baseline build passed, and the existing chain/room/NPC dependencies were audited.

## Implementation

What was wrong: New plot steps would conflict with the hardcoded virtual indices and needed actual floor content to make the new NPCs reachable.

What was done: Added Nikanor, Marfa, and Jean to plot data; added their room specs; generated Hell contact/Herald rooms and the Void warning cell through floor manifests; converted the Herald portal helper to follow the data-chain Herald quest.

## Polish Mandate

Added chain read aloud for dependency order:

1. Step 11: Никанор Обожжённый sends the player to Марфа Пороговая and rewards `psi_phase`.
2. Step 12: Марфа asks the player to kill three Вестники; the third kill opens the Void portal.
3. Step 13: Жан Пустотник asks for the nearby `bottled_voice` to prove the voice is local.
4. Step 14: Жан sends the player to kill the local Творец.
5. Step 15: Жан takes the rewarded `void_spike` so the return consequence stays in Void.

Deleted step: the standalone VISIT-VOID step was removed because the portal appears immediately after the Herald fight and the player could enter it before accepting that quest. The Herald kill step now owns the threshold.

## Final Report

What was done:

- Extended `PLOT_CHAIN` from step 10 to step 15 using existing `QuestType` values only.
- Added 3 plot NPC definitions and 3 plot room specs.
- Added `src/gen/hell/plot_chain.ts` and `src/gen/void/plot_chain.ts`, wired through Hell/Void content manifests.
- Updated `src/data/plot_events.ts` so it no longer creates hidden Hell/Void quests and opens the portal from the data-chain Herald quest.
- Updated README shipped plot and generation facts.
- Observed the unit-test runner wrapper being changed during validation; AG27 validation used the current wrapper and an isolated AG27 test build to avoid `.test-build` churn.

Validation:

- Baseline `npm run build` passed before edits.
- `npm run typecheck` passed.
- Unit tests passed in an isolated AG27 build: 26 tests.
- `npm run build` passed.
- Standalone `npm run smoke` passed.
- `npm run check` was attempted. The final wrapper attempt passed typecheck, unit tests, and build, then smoke exited with code `-1` after Chrome startup without printing a smoke assertion failure; standalone smoke had passed immediately before.
