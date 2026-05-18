# LOG_UNASSIGNED

## 2026-05-17 - Procedural Adult Art Studies

What was wrong:
- The project had no procedural sprite variants for the requested adult female figure-study content.
- The local checkout had no `AGENTS.md`, `CURRENT_BATCH.md`, `.agents-skills/`, or domain file, so there was no valid batch ID to extract.
- Existing renderer draws sprites through indexed `Entity` billboards; adding a new render path would be excess surface area.

What was done:
- Added `src/render/art_sprites.ts` with four 64x64 procedural, non-explicit adult art-study silhouettes.
- Extended `src/render/sprite_index.ts` with `Spr.ART_NUDE_BASE` and four named variant IDs.
- Appended the art-study sprites in `src/render/sprites.ts` after existing projectiles so sprite indices remain auto-computed.
- Added `src/gen/living/art_studies.ts`, a self-contained Living-floor zone 14 gallery with four static empty-inventory sprite entities, lamps, door registration, and wall art.
- Registered the gallery through `src/gen/living/content_manifest.ts`.
- Updated `README.md` and `desdoc.md` to record the implemented POI and the non-interactive/non-pornographic boundary.

Cinematic Cheats used:
- Static billboard sculptures instead of animated adult NPCs.
- Pedestal, hair, contour, and light/shadow pixels sell the figure-study read at 64x64.
- Empty `ITEM_DROP` entities reuse the existing render path and pickup ignore path.
- Fixed local gallery placement instead of global scattering or simulation.

Exact Microseconds saved:
- New render system avoided: estimated 40-120 us/frame saved versus a bespoke decorative entity pass.
- AI/NPC adult behavior avoided: estimated 100-300 us/frame saved during dense NPC updates.
- No runtime placement scan: estimated 20-80 us/frame saved versus checking gallery/decor state per frame.
- Actual added recurring gameplay/system cost: 0 us/frame outside normal sprite rendering; four extra billboard draws only when the gallery is visible.

Verification:
- `npm run build` passed twice through Vite singlefile output.
- Final output: `dist/index.html` built at 687.06 kB, gzip 211.98 kB.

## 2026-05-17 - Test Harness And Playability Gate

What was wrong:
- The project had no automated test script; `npm run build` only exercised Vite transpilation and bundling.
- There was no repeatable proof that the built game still opened, accepted start input, created WebGL2, and rendered nonblank canvases.
- A first strict test compile exposed source typecheck drift in `src/systems/samosbor.ts` during the shared worktree session; the current source now typechecks cleanly.
- A first browser smoke failed because headless Chrome with disabled GPU could not create WebGL2.

What was done:
- Added `tsconfig.test.json` and Node built-in unit tests under `tests/`.
- Added `npm run typecheck`, `npm run test`, `npm run test:unit`, `npm run smoke`, and `npm run check`.
- Added `.gitignore` entry for `.test-build/`.
- Added `scripts/smoke-playability.mjs`: starts Vite preview, opens Chrome headless via CDP, captures runtime exceptions, presses Enter, holds W, samples HUD pixels, and verifies WebGL is alive.
- Updated README build/test commands.
- Updated status/rationale files with evidence and hardware impact.

Cinematic Cheats used:
- Test harness is compile-time only, not an in-game telemetry overlay.
- Chrome smoke uses SwiftShader/ANGLE to validate the low-end software WebGL path instead of requiring a real GPU.
- Pixel-count checks prove nonblank title/HUD/WebGL output without brittle screenshot matching.
- All six floor generators are checked for passable spawn and live actors instead of simulating a long play session.

Exact Microseconds saved:
- Runtime test hooks avoided: estimated 20-80 us/frame saved versus adding in-game assertion/telemetry polling.
- Heavy browser test framework avoided: 0 us/frame and no runtime bundle growth; install/download overhead avoided.
- Manual smoke repetition avoided: engineering-time saving only; gameplay frame impact 0 us/frame.
- Headless `readPixels` warnings are smoke-only and cost 0 us/frame in normal gameplay.

Verification:
- `npm run check` passed.
- Typecheck: `tsc --noEmit` passed.
- Unit tests: 15/15 passed.
- Build: `dist/index.html` built at 720.71 kB, gzip 222.56 kB.
- Smoke: headless Chrome passed with `hudLit=36864`, `webglLit=1024`, Enter start path and W input dispatched.

## 2026-05-17 - Floor 69 Female NPC Sprite Bank

What was wrong:
- Future floor 69 had no dedicated female NPC sprite IDs.
- The existing adult art-study sprites were static decor, not suitable as NPC sprite assignments.

What was done:
- Added eight procedural female NPC sprite variants in `src/render/art_sprites.ts`.
- Variants differ by hair color and seeded silhouette details.
- Registered stable IDs in `src/render/sprite_index.ts`: `Spr.F69_FEMALE_NPC_BASE` and `Spr.F69_FEMALE_NPC_0..7`.
- Appended the variants to `generateSprites()` in `src/render/sprites.ts`.
- Updated `README.md` and `desdoc.md` to mark this as a sprite bank only, not a new floor or spawn system.

Cinematic Cheats used:
- Low-resolution figure-study NPC silhouettes with hair-color identity instead of explicit anatomy.
- Reused the existing sprite sheet and billboard renderer.
- No FloorLevel 69 generator, no AI, no economy, no extra runtime systems.

Exact Microseconds saved:
- New floor system avoided: estimated 0.1-0.5 ms/frame risk avoided in prototype form.
- Adult NPC behavior avoided: estimated 100-300 us/frame avoided in dense NPC scenes.
- Actual current recurring cost: 0 us/frame because no entities spawn from the bank yet.

Verification:
- `npm run build` passed twice after the sprite-bank addition.
- Final output: `dist/index.html` built at 715.50 kB, gzip 221.24 kB.

## 2026-05-17 - Safe Runtime Optimization Pass

What was wrong:
- `optimization.md` did not exist.
- `updateDynamicData()` uploaded full 1024x1024 wall/fog/door-state data every frame even when unchanged.
- AI allocated a fresh entity lookup `Map` every frame.
- Sprite rendering allocated one visible-sprite record per visible entity per frame.
- Combat scan intervals used fresh random values in hot update paths.
- HUD/container proximity checks used square roots where squared distance preserves identical thresholds.
- BFS neighbor wrapping used modulo-heavy expressions in the inner loop.

What was done:
- Added `optimization.md` with code-grounded findings, completed work, rejected broad rewrites, and next safe steps.
- Added runtime texture dirty versions for wall, floor, and fog data in `World`.
- Changed WebGL dynamic uploads so wall/floor/fog textures upload only when versions change.
- Changed door-state upload to compare the cached byte buffer and upload only on changed states.
- Ensured runtime door/wall construction calls `updateWorldData()` so renderer data stays in sync with gameplay cells.
- Reused the AI entity lookup map instead of allocating a new `Map` each frame.
- Replaced visible sprite object records with reused parallel arrays and sorted indices.
- Replaced random combat scan cadence with deterministic per-entity jitter.
- Replaced HUD/container proximity `sqrt` checks with `dist2`.
- Replaced BFS neighbor modulo wrapping with branch wrapping.
- Added `containerById` lookup for direct production output container access.

Cinematic Cheats used:
- Dirty-version uploads instead of chunked texture streaming.
- Deterministic hash jitter instead of per-frame randomization.
- Reused arrays and byte buffers instead of new renderer/AI architecture.
- Branch wrapping preserves toroidal behavior without changing pathfinding limits.

Exact Microseconds saved:
- Dynamic texture uploads avoided in calm frames: estimated 50-200 us/frame on low-end i3/MX350-class paths.
- Door-state full buffer fill/upload avoided when doors are unchanged: estimated 20-80 us/frame depending on browser/driver.
- AI/sprite allocation removal: estimated 20-120 us/frame under dense entity counts, plus lower GC spike risk.
- Math micro-hotpaths: estimated 5-40 us/frame in ordinary play, higher during pathfinding bursts.
- Actual functionality removed: 0. Save schema changed: no.

Verification:
- Baseline `npm run build` passed before edits.
- Post-edit `npm run build` passed through Vite singlefile output.
- Final `npm run build` passed after documentation/status/log updates: `dist/index.html` 720.70 kB, gzip 222.55 kB.

## 2026-05-17 - Test Harness Final Verification Refresh

What was wrong:
- Parallel agent log appends moved the detailed "Test Harness And Playability Gate" report away from the bottom of this file.

What was done:
- Re-ran the complete verification gate after all local test/docs/log edits.
- Kept the detailed test-harness report above intact; this addendum records the latest bottom-of-log evidence.

Cinematic Cheats used:
- No runtime hooks; verification stays external through TypeScript, Node tests, Vite build, and Chrome CDP smoke.

Exact Microseconds saved:
- Runtime cost remains 0 us/frame.

Verification:
- `npm run check` passed after the final documentation/log writes.
- Typecheck passed.
- Unit tests passed: 15/15.
- Build passed: `dist/index.html` 720.78 kB, gzip 222.58 kB.
- Smoke passed: headless Chrome reported `hudLit=36864`, `webglLit=1024`.
