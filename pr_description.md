Title: 🧹 [Refactor] Extract logic from monolithic gameLoop

🎯 What:
The `gameLoop` function in `src/main.ts` was a monolithic 525-line function that handled multiple distinct responsibilities: deferred loading, input/title processing, living simulation updates, post-death simulation, and rendering. We extracted these responsibilities into five separate helper functions (`processDeferredLoading`, `processInputAndTitle`, `updateAliveSimulation`, `updateDeadSimulation`, and `renderFrame`).

💡 Why:
A 525-line function is extremely difficult to read, maintain, and test. By splitting the logic into focused, single-responsibility functions, the main `gameLoop` becomes a clear, high-level orchestrator of the game's frame lifecycle. This makes the code much more readable, simplifies future debugging and feature additions, and follows better software engineering practices.

✅ Verification:
- Carefully extracted logic retaining exact existing behavior, verifying the logic manually using regex and AST checking.
- Ran static type checking (`npm run typecheck`) which passed.
- Ran the relevant validation test suite (`npm run test:unit`) which confirmed that no regressions were introduced and that all 189 simulation logic tests passed without issue.

✨ Result:
The `gameLoop` function is now around 60 lines, clearly mapping the lifecycle of each frame, while the separated logic encapsulates specific domain behaviors. Maintainability is significantly improved with zero functional regressions.
