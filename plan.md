1. **Update Camera Mode Definition (`src/systems/camera.ts`)**:
   - Use `replace_with_git_merge_diff` to update `startCinematicCamera` to accept a waypoints array of `{x: number, y: number}`, a `lookAtTarget` optionally, and an optional `speed` parameter.
   - Use `replace_with_git_merge_diff` to redefine `CinematicCameraState` to include `splinePoints: Array<{x: number, y: number, time: number}>`, `splineProgress`, `splineDuration`, and `lookAtTarget`. Calculate duration based on distance and provided speed.

2. **Implement Catmull-Rom Spline Interpolation (`src/systems/camera.ts`)**:
   - Use `replace_with_git_merge_diff` to add the `evaluateSpline(points: Array<{x: number, y: number, time: number}>, t: number): {x: number, y: number}` function.
   - Use `replace_with_git_merge_diff` to update `updateCinematicCamera` to use `evaluateSpline` over `t` from 0 to 1 based on progress. Calculate camera `angle` based on `lookAtTarget` if provided, otherwise compute velocity tangent.
   - Use `replace_with_git_merge_diff` to change the camera mode back to `'player'` via `followPlayerCamera(camera)` when the flight reaches `t >= 1`.

3. **Fog Density & Skip Control (`src/main.ts`)**:
   - Use `replace_with_git_merge_diff` to lower the `fogDensity` in `src/main.ts` where `fogDensity` is calculated, if `runtimeCamera.mode === 'cinematic'`.
   - Use `replace_with_git_merge_diff` inside `src/main.ts` input processing loop (right after `handleTitleGamepadInput` and resolving inputs) to cancel cinematic flight by calling `followPlayerCamera(runtimeCamera)` if `runtimeCamera.mode === 'cinematic'` and any action in `inputFrame.pressedActions` is present.

4. **Verify Implementation Files**:
   - Use `run_in_bash_session` to run `git diff` and verify the file edits to `src/systems/camera.ts` and `src/main.ts` were applied successfully and compile without syntax errors.

5. **Write Unit Tests**:
   - Use `replace_with_git_merge_diff` to append a new `test(...)` block in `tests/camera.test.ts` that explicitly calls `evaluateSpline` with an array of predefined waypoints and asserts the interpolated `{x, y}` output at `t=0.5` and `t=1.0`. Add another test for `startCinematicCamera` and `updateCinematicCamera` completing properly.

6. **Verify Tests**:
   - Use `run_in_bash_session` to run `npm run typecheck`, run the targeted test (`npx tsx --test tests/camera.test.ts`), and run the full test suite in the background (`npm run check:readonly > check_readonly_output.txt 2>&1 &`). Include commands to monitor the output (e.g. `sleep 10; tail -n 20 check_readonly_output.txt`) and remove the log file (`rm check_readonly_output.txt check_pid.txt`) before committing.

7. **Pre-commit Steps**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
