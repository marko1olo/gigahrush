1. **Analyze `gameLoop`**:
   The `gameLoop` function in `src/main.ts` is over 500 lines long and handles everything from loading screens to input processing, game simulation update loops (player logic, entities, AI, Samosbor, Needs), and rendering calls.

2. **Refactoring Strategy**:
   The logic inside `if (!state.paused && !state.gameOver) { ... }` represents the main alive simulation loop. The logic inside `if (!state.paused && state.gameOver) { ... }` represents the post-death simulation loop. Both of these share a large amount of logic and take up ~250 lines in total.

   I'll extract the game simulation parts into smaller helper functions in `src/main.ts`.

   Extract `updateSimulationAlive(dt: number, frameDt: number, simStart: number)` for the `!state.paused && !state.gameOver` branch.
   Extract `updateSimulationDead(dt: number, frameDt: number)` for the `!state.paused && state.gameOver` branch.

   Wait, it's probably better to extract the render logic into a separate `renderGameFrame()` and the input logic as well, or just refactor `updateSimulationAlive` and `updateSimulationDead`.

   Let's check the local state variables used in those sections:
   `needsTickAccum`, `needsRealTickAccum`, `lastNeedsUpdateMs`, `lastContentHookMs`, `lastHazardUpdateMs`, `lastSamosborUpdateMs`, `lastFactionUpdateMs`, `lastBloodUpdateMs`, `lastCleanupUpdateMs`, `bloodTrailAccum`, `lastAiUpdateMs`, `nextEntityId`, `currentLocalSamosborPatchGeneration`, `scheduleLocalSamosborPatch`, etc.

   Actually, if I extract `updateSimulationAlive` and `updateSimulationDead`, I might need to pass or return a boolean `didLoad` to indicate if we hit `pendingLoad` inside and need to bail out early.

   Let's refactor the game loop by extracting:
   1. `updateMainSimulation(dt: number, frameDt: number, simStart: number): boolean`
   2. `updateDeadSimulation(dt: number, frameDt: number): boolean`
   3. `renderGameLoop(dt: number, rawDt: number)`

   Let's look at `renderGameLoop` variables:
   It uses `now`, `rawDt`, `dt`, `currentFps`...
