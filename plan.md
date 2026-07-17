1.  **Extract `isActiveKillQuestTarget` to `src/systems/quests.ts`:**
    *   Currently, there are two variations of `isActiveKillQuestTarget`, one in `src/main.ts` (loops over current `state.quests`) and another in `src/render/map_ui.ts` (uses cached globals updated per frame like `activeKillNpcIds`).
    *   To improve DRY and simplify logic, I will consolidate this into one function in `src/systems/quests.ts`.
    *   The exported function will take the list of quests as a second parameter to keep it pure and avoid cyclic dependencies on global state: `export function isActiveKillQuestTarget(e: Entity, quests: readonly Quest[]): boolean`

2.  **Clean up `src/main.ts`:**
    *   Remove the local `isActiveKillQuestTarget` definition.
    *   Import `isActiveKillQuestTarget` from `src/systems/quests.ts`.
    *   Update references to use the new signature: `isActiveKillQuestTarget(e, state.quests)`.

3.  **Clean up `src/render/map_ui.ts`:**
    *   Remove the local `isActiveKillQuestTarget` definition.
    *   Import the shared function from `src/systems/quests.ts`.
    *   Update `isActiveKillQuestTarget(e)` to `isActiveKillQuestTarget(e, quests)` (since the map render loop has `quests` available from the gamestate).
    *   Since `map_ui.ts` no longer needs its local caching just for this logic, I will also remove `registerActiveKillTarget`, `activeKillKinds`, `activeKillNpcIds`, `activeKillPlotNpcIds`, and `activeKillAnyMonster`.
    *   Update `hasActiveKillTargets` (or remove it entirely) to just check `quests.some(q => !q.done && q.type === QuestType.KILL)`. This eliminates redundant state sync.

4.  **Complete pre-commit steps:**
    *   Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5.  **Submit PR:**
    *   Title: `🧹 Extract duplicated isActiveKillQuestTarget to quests system`
    *   Description will include:
        *   🎯 **What:** Moved duplicate `isActiveKillQuestTarget` logic from `src/main.ts` and `src/render/map_ui.ts` to `src/systems/quests.ts`.
        *   💡 **Why:** Reduces duplicate code, removes redundant caching from the UI, and simplifies the codebase.
        *   ✅ **Verification:** Typechecking and tests pass, no functional regressions.
        *   ✨ **Result:** Better DRY compliance and maintainability.
