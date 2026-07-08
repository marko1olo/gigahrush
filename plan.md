1. **Understand the code**: `src/systems/danger_field.ts` contains a large `updateDangerField` function (~120 lines). It handles allocating/clearing the buffer, calculating the active bounding box, applying spread/fade rules to cells, bounds clipping, and finally swapping the backbuffer to the main field.
2. **Design the Improvement**: Break `updateDangerField` into focused helper functions. The logical breakdown inside the function is:
   - `prepareNextField`: Set up the backbuffer `nextField`
   - `processCells`: Core loop processing active cells and spreading danger value.
   - `updateActiveBounds`: Update `activeMinX`, `activeMinY` etc. based on results of `processCells`.
   - `commitNextField`: Apply the backbuffer `nextField` to the main `world.dangerField`.
3. **Refactor**: Apply this change to `src/systems/danger_field.ts`. Make sure to pass necessary values explicitly and not to break the main functionality. Ensure state variables (`activeMinX`, `isFullScan`, `nextField`, etc) remain correctly scoped or mutated as they are file-level singletons in the original file.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the PR**: Create a PR titled "🧹 Refactor danger_field.ts to improve readability".
