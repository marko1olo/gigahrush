1. **Understand the problem**:
   - `objectiveTargetEntity` in `src/systems/quests.ts` does O(N) array search on `entities` via `entities.find`.
   - The user wants this to be O(1) by utilizing a Map or an index for `plotNpcIds`.

2. **Add `byPlotNpcId` to `EntityIndex`**:
   - In `src/systems/entity_index.ts`, add a `readonly byPlotNpcId = new Map<string, Entity>();` inside the `EntityIndex` class.
   - Update `rebuild` to clear `byPlotNpcId` and populate it when iterating entities (if `e.plotNpcId` exists).
   - Update `rebuildDynamicForSimulation` to clear `byPlotNpcId`, remove dynamically deleted entities from it, and add dynamically added ones. Wait, clearing dynamically and rebuilding from static vs dynamic would be cleaner to just handle like `byId`. `byId` is cleared and fully repopulated in `rebuildDynamicForSimulation`? No, let's look at how `byId` works.
   - Let's read `rebuildDynamicForSimulation` closely to mimic `byId`.

3. **Update `objectiveTargetEntity` to use O(1) lookups**:
   - Instead of calling `entities.find`, import `ensureEntityIndex` from `./entity_index` (since `getEntityIndex` might be stale if index wasn't ensured for the currently passed `entities`, though memory says use `ensureEntityIndex(entities)`).
   - Update `objectiveTargetEntity` to:
     ```typescript
     function objectiveTargetEntity(q: Quest, entities: readonly Entity[]): Entity | undefined {
       const index = ensureEntityIndex(entities);
       if (q.targetNpcId !== undefined) {
         const e = index.byId.get(q.targetNpcId);
         if (e && e.alive) return e;
       }
       if (q.targetPlotNpcId) {
         const e = index.byPlotNpcId.get(q.targetPlotNpcId);
         if (e && e.alive) return e;
       }
       return undefined;
     }
     ```
   - Make sure `ensureEntityIndex` is imported in `src/systems/quests.ts`.

4. **Tests**:
   - Run tests to make sure `getCurrentObjective` works correctly.

5. **Pre-commit**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

6. **Submit**:
   - Create PR.
