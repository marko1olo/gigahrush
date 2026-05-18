# AG27 Main Plot Next Chain Rationale

## Decision 0 - Use PLOT_CHAIN As Source Of Truth

Problem: Hell/Void already had hardcoded helper quests for killing Heralds and killing the Creator. Adding real plot steps at the same indices would make the new chain unreachable or duplicate quests.

Solution: Keep `systems/quests.ts` unchanged and move the continuation into `PLOT_CHAIN`. The event helper now only opens the Void portal when the active data-chain Herald quest is complete, and Void entry only prints trap/hint messages.

Rejected Alternatives: Leaving the hardcoded virtual quests would block the new data-driven steps. Rewriting quest completion or main loop transitions would exceed the prompt.

Runtime Impact: Portal checks still run only on Herald/Creator kill events; no per-frame scan was added.

## Decision 1 - Make The Threshold The Herald Quest

Problem: A separate VISIT-VOID step after killing Heralds can be skipped accidentally because the portal opens immediately at the last Herald's cell.

Solution: Delete that step. The Herald kill quest is the threshold step; once it is done, the next plot giver is already spawned near the Void entry.

Rejected Alternatives: Gating portal travel on a later quest would require new transition logic. Auto-creating another quest on portal entry would reintroduce hidden story logic.

Runtime Impact: Fewer quest objects and no new checks.

## Decision 2 - Local Victory, Not Cosmic Explanation

Problem: The prompt asks to move toward Hell/Void/Creator without explaining the whole setting.

Solution: Nikanor and Marfa frame the Heralds as local threshold keepers. Жан calls the Creator a local mechanism, then asks the player to leave the void spike behind before returning.

Rejected Alternatives: A global lore reveal, final apocalypse, or permanent world-state rewrite would fight the tone and require broader systems.

Runtime Impact: Pure data/dialogue/generation content.
