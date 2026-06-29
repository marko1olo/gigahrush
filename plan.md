1. **Goal**: Refactor the overly long `gameLoop` function in `src/main.ts` by extracting logical blocks into smaller, cohesive functions to improve code health and readability, without changing the observable behavior.

2. **Analysis**:
   - `gameLoop` is ~500 lines long (lines 7546 to 8079).
   - It performs several major tasks:
     1. Deferred Loading checks (`pendingLoad`).
     2. Input parsing (gamepad, keyboard, external pause handling).
     3. Main "Alive" simulation loop (when `!state.paused && !state.gameOver`), managing game clock, systems updates (needs, AI, Samosbor, collisions), and state changes.
     4. "Dead" simulation loop (when `!state.paused && state.gameOver`), allowing the world to continue simulating while the player is dead.
     5. Camera and rendering updates (WebGL, HUD).

3. **Refactoring Steps**:
   I will create helper functions in `src/main.ts` just above `gameLoop` (around line 7546):

   - **`updateSimulationAlive(dt: number, frameDt: number): boolean`**
     This will encapsulate the contents of `if (!state.paused && !state.gameOver) { ... }`.
     It will return `true` if `pendingLoad` was set (meaning we need to bail out of the frame early by calling `requestAnimationFrame(gameLoop); return;`).
     This requires moving variables like `lastNeedsUpdateMs`, `lastContentHookMs`, `lastSamosborUpdateMs` inside or modifying global ones since they are module-level `let`s. Wait, `lastNeedsUpdateMs` etc are already module-level `let`s! (Lines 7432-7442). We can just access them. `bloodTrailAccum`, `deadCleanupAccum`, `needsTickAccum` are also module-level! This makes extraction very easy.

   - **`updateSimulationDead(dt: number, frameDt: number): boolean`**
     This will encapsulate the contents of `if (!state.paused && state.gameOver) { ... }`.
     It will also return `true` if a pending load was triggered.

   - **`renderGame(dt: number, rawDt: number, currentFps: number): void`**
     This will encapsulate the rendering logic at the end of `gameLoop` (Fog calculation, `renderSceneGL`, `drawHUD`). Wait, this relies on `now`, `uiTime`, `cameraFovRadians()`, `world`, `player`, `state`, etc. Since `world`, `player`, `state` are module-level, we only need to pass `dt`, `rawDt` (if needed for FPS), `now` (for HUD or FPS), and `currentFps`. Actually, `currentFps` is calculated just before rendering.
     We'll extract `renderGameFrame(now: number, dt: number, rawDt: number, currentFps: number)`.

4. **Integration in `gameLoop`**:
   The new `gameLoop` will look roughly like:
   ```typescript
   function gameLoop(now: number): void {
     if (handleDeferredLoading(now)) return;
     if (handleInputFrame(now)) return;

     const rawDt = (now - lastTime) / 1000;
     lastTime = now;
     const frameDt = Math.min(rawDt, 0.05); // cap delta
     uiTime += frameDt;
     let dt = frameDt;

     // ... Sleep modifier ...
     if (state.sleeping) dt *= SLEEP_TIME_MULT;

     handleMenuInput();
     if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

     if (!state.paused) {
       entityIndexFrame = (entityIndexFrame + 1) & 0x3fffffff;
     }

     // Visual decays
     if (state.dmgFlash > 0) state.dmgFlash = Math.max(0, state.dmgFlash - dt * 1.2);
     if (state.beamFx > 0) state.beamFx = Math.max(0, state.beamFx - dt * 2.5);
     if (state.uvBeamFx > 0) state.uvBeamFx = Math.max(0, state.uvBeamFx - dt);

     if (state.gameOver && runtimeCamera.mode === 'death') {
       state.deathTimer += dt;
       updateRuntimeCamera(runtimeCamera, world, dt);
     }

     if (!state.paused && !state.gameOver) {
       if (updateSimulationAlive(dt, frameDt)) return;
     }

     if (!state.paused && state.gameOver) {
       if (updateSimulationDead(dt, frameDt)) return;
     }

     if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

     if (!state.gameOver) {
       // camera updates
     }

     checkRestart();
     updateMobileContext();
     const currentFps = updateFpsMeter(now, rawDt * 1000);

     renderGameFrame(now, dt, currentFps);
     requestAnimationFrame(gameLoop);
   }
   ```

5. **Testing & Pre-commit**:
   - Run typecheck (`npm run typecheck`).
   - Run unit tests (`npm run test:unit`).
   - Call `pre_commit_instructions` as required by the directives to ensure testing, verifications, review, and reflection are done.

6. **Submit**:
   Create a branch, commit with an appropriate title and body.
