🧹 [code health improvement] Refactor `ellipse` function in `blood_plant.ts`

🎯 **What:** The `ellipse` function in `src/entities/blood_plant.ts` had 10 parameters, which made calls difficult to read and maintain. The function signature has been refactored to take an `EllipseOpts` configuration object containing all the parameters. All internal calls to this function have been updated to use the new object signature.

💡 **Why:** Reduces parameter count and improves readability. When passing 10 primitive parameters, it's easy to make mistakes with the order, and the intent of each parameter is hidden at the call site. Using an options object ensures the caller explicitly labels `cx`, `cy`, `rx`, `ry`, etc.

✅ **Verification:**
- Successfully passed `npm run typecheck`
- Successfully passed `npm run content:audit`
- Successfully passed full test suite via `npm run test:unit`
- Directly passed isolated `tests/monster_blood_plant.test.ts` and `tests/monster_15_blood_plant.test.ts`

✨ **Result:** The `ellipse` function in `blood_plant.ts` is now clean and easier to invoke without guessing the argument order. No functionality or game behavior was changed.
