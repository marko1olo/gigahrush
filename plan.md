1. **Update `saveGame` function in `src/main.ts`**
   - Add a guard `if (state.tutorialMode) { console.debug("Auto-save skipped: player is in tutorial mode."); return; }` at the beginning of `saveGame()`.

2. **Update `checkRestart` in `src/main.ts`**
   - In `checkRestart()`, if `state.tutorialMode` is true and the player is dead (`state.gameOver`), both `escape` and `use` should reset the tutorial completely instead of continuing as a random NPC or loading a save (in case `initGame()` relies on state incorrectly without `isNewGame` flag).
   Actually, `initGame()` defaults `isTutorial` to `false`. So we should ensure it passes `true` for `isTutorial`.
   Wait, if we press `input.use`, it calls `initGame()`, which starts at default floor without `isTutorial`. We need it to restart tutorial if `state.tutorialMode` is true.

   ```typescript
   function checkRestart(): void {
     if (state.gameOver && input.escape) {
       if (state.tutorialMode) {
         returnToTitleScreen();
         input.escape = false;
         return;
       }
       continueDeathAsRandomNpc();
       input.escape = false;
       return;
     }
     if (state.gameOver && input.use) {
       if (state.tutorialMode) {
         resetRuntimeCamera(runtimeCamera);
         scheduleLoading(() => {
           initGame(undefined, undefined, true);
           startTutorial(state, player);
         });
         input.use = false;
         return;
       }
       resetRuntimeCamera(runtimeCamera);
       scheduleLoading(() => { initGame(); });
       input.use = false;
     }
   }
   ```
   If they press escape, `returnToTitleScreen();` seems right.
   If they press use ("Заново"), it will restart the tutorial.

3. **Verify UI changes**
   - The user task mentions removing a separate "Туториал" button in the main menu, but there is no such explicit button in `GAME_MENU_ITEMS` or `getTitleSetupFields()`. I have verified this. No UI removal is required, but I will make sure the changes exactly match the business logic of new game triggering tutorial and disabling save.

4. **Run `pre_commit_instructions` and submit**
   - Use `pre_commit_instructions` tool to run required checks and submit the PR.
