# AGENT_02_SAMOSBOR_VARIANTS Rationale

## Preflight Decisions

Problem: The mandate registry `.agents-skills` is referenced by the session instructions but is absent from this checkout.
Solution: Use the prompt-selected mandates and required design sections as the active mandate set, and record the missing registry explicitly.
Rejected Alternatives: Inventing mandate filenames or depending on Windows-only `C:\hades\Hecton8` paths would create unverifiable process theater.
Scalability potential: No runtime impact.
Hardware Impact: 0 us runtime.

Problem: The implementation touches a live codebase with parallel agents.
Solution: Limit changes to owned files and add a standalone data module consumed by existing Samosbor/HUD/map/debug paths.
Rejected Alternatives: Editing shared generation helpers or core enums would increase conflict risk and violate write scope.
Scalability potential: Variant data remains cheap on low devices and can drive richer cosmetics on high/ultra without changing core flow.
Hardware Impact: Expected runtime gain/loss 0-5 us per frame; no new wide scans.

## Math LOD Plan

Low: warning messages, spawn multipliers, and duration/seal timing only.
Middle: fog tint and HUD label.
High: minimap/full-map fog coloring uses active variant tint.
Ultra: optional bounded cosmetic cues through existing message/HUD paths only; no particle simulator.

## Task 1 Baseline Flow

Problem: Existing samosbor flow is monolithic in `src/systems/samosbor.ts`.
Solution: Keep the flow order intact: timer expires in `updateSamosbor()` -> active flag set -> duration rolled -> alarm/message -> `forceHide()` -> `captureZone()` -> corridor/random monster spawn -> seal near end -> existing `spreadFog()` every tick -> `spawnFogMonsters()` while active -> end resets timer/unseals/reassigns quests/rebuild signal.
Rejected Alternatives: Replacing the state machine or moving rebuild ownership would be a cross-domain rewrite.
Scalability potential: Variants become multipliers and messages over the existing loop; low devices pay no extra broad scans, high/ultra can spend HUD/map color only.
Hardware Impact: Expected cost below 10 us at start/end only; per-frame path remains existing fog sample loop.

Problem: Exact functions need ownership before edits.
Solution: Touch targets are `updateSamosbor`, `spawnMonsters`, `spawnRandomMapMonsters`, `captureZone`, `spawnFogMonsters` in `src/systems/samosbor.ts`; Samosbor warning label in `src/render/hud.ts`; fog tint branch in `src/render/map_ui.ts`; debug command list in `src/systems/debug.ts`; docs in `README.md`.
Rejected Alternatives: Editing AI, inventory, quests, economy, world generation, `Cell`, or `FloorLevel` would violate prompt scope.
Scalability potential: All variant behavior uses existing data routes and one small active-runtime object.
Hardware Impact: 0 us until active samosbor; map tint reads one cached active object per draw call.

## Tasks 2-5 Decisions

Problem: Variant state must be visible to system, HUD, map, and debug without save incompatibility.
Solution: `src/data/samosbor_variants.ts` owns `activeVariant` and `forcedNextVariant` module state plus typed accessors.
Rejected Alternatives: Adding required `GameState` fields would force save/load changes and increase conflict risk in `main.ts`.
Scalability potential: Low tier uses the same selected runtime for spawn/timing. Middle/high/ultra can read tint and modifiers without reselecting.
Hardware Impact: Selection is O(variant count + modifier count), below 10 us at samosbor start.

## Tasks 6-10 Decisions

Problem: Variants need runtime behavior without destabilizing old samosbor timing.
Solution: Preserve `samosborInterval()` and the existing active/end state machine. Only active duration, spawn counts, fog seed radius/strength, fog spawn interval, and seal threshold read the selected runtime.
Rejected Alternatives: A new event scheduler or per-zone simulator would exceed the 0.1 ms suspicion threshold.
Scalability potential: Low devices get multipliers and messages. Middle devices see tint and seal timing. High/Ultra get HUD/map tint and bounded Hell meat texture marks.
Hardware Impact: Start-time work adds O(1) selection and bounded radius <= 7 cell texture/fog seed operations; map draw uses one cached tint lookup per draw call, not per cell.

Problem: Quiet variant must not break the classic alarm.
Solution: `playSamosborAlarm()` is skipped only when the active runtime has `noSiren`; classic has no such modifier and still calls the alarm.
Rejected Alternatives: Muting global audio or rewriting audio profiles would be cross-domain and hard to verify.
Scalability potential: Audio behavior remains deterministic and variant-readable.
Hardware Impact: 0 us runtime beyond one boolean branch at start.

Problem: Debug forcing needs to work inside the existing debug UI without `main.ts` scope creep.
Solution: Reuse the existing force-samosbor command: it cycles `forcedNextVariant` and sets `samosborTimer = 0`.
Rejected Alternatives: Adding typed debug console input or increasing debug selection bounds in `main.ts` would touch non-owned input/menu code.
Scalability potential: Demonstrates every non-classic variant by repeated command use.
Hardware Impact: 0 us outside debug command execution.

## Tasks 11-12 Decisions

Problem: README must describe only shipped behavior.
Solution: Added a compact variants section under Purple Fog with the five implemented variants, runtime effects, floor weighting, and debug cycle command.
Rejected Alternatives: Documenting future event hooks, economy impact, or NPC behavior impact would be false reporting.
Scalability potential: Docs expose current low/middle/high/ultra levers without claiming unsupported simulation.
Hardware Impact: 0 us runtime.

## Polish Mandate

Problem: Modifier data had fields that were not read by runtime code.
Solution: Removed unread modifier display/boolean fields and kept only ids, warning lines, and numeric/mechanical fields consumed by samosbor.
Rejected Alternatives: Keeping decorative fields for future work would violate the anti-bloat mandate.
Scalability potential: Smaller data surface; future modifiers must prove a runtime read path.
Hardware Impact: Negligible bundle/data reduction; no runtime regression.

Problem: Classic behavior must remain intact.
Solution: Verified classic only carries `dense_fog`; alarm call is gated by `!variant.noSiren`, so classic still calls `playSamosborAlarm()`.
Rejected Alternatives: Adding a special classic branch would duplicate logic and increase regression risk.
Scalability potential: All variants use one branch; quiet is the only no-siren path.
Hardware Impact: 0 us beyond existing branch.

## 2026-05-17 Render Lag Hotfix

Problem: User reports lag during samosbor and death, and code inspection showed the visible fullscreen static effect was drawn as one canvas `fillRect` per 4x4 block every frame.
Solution: Replaced per-block canvas drawing with a cached low-resolution noise bitmap in `src/render/hud_fx.ts`, refreshed at 12 Hz and scaled nearest-neighbour over the same screen area.
Rejected Alternatives: Removing static/noise entirely would erase the visual identity; keeping per-pixel canvas operations violates the frame-time dictatorship on cheap devices.
Scalability potential: Low devices get the same coarse static as one cached bitmap blit. Middle devices keep fullscreen noise. High and Ultra keep the same samosbor/death intensity without spending CPU per screen block.
Hardware Impact: Estimated 3,000-12,000 us/frame saved on i3/MX350-class hardware at 1080p during samosbor/death static; more at higher HUD canvas sizes.

Problem: Death and combat effects stamp blood/surface marks, but WebGL rebuilt a 512x512 surface atlas plus a 1024x1024 index texture every frame even when no mark changed.
Solution: Added `World.surfaceVersion`, bumped it from `stampMark()` and cleaning, and made `updateDynamicData()` upload the surface atlas only when the version changes or when the camera tile must be reselected for overflowed mark slots.
Rejected Alternatives: Disabling blood pools/surface marks would hide feedback; rebuilding and sorting all surface marks every frame is a fake visual-cost tax.
Scalability potential: Low devices pay only on actual mark changes. Middle devices keep persistent marks. High and Ultra can accumulate more marks without forcing a rebuild every frame.
Hardware Impact: Estimated 1,500-6,000 us/frame saved after gore/death bursts with many marked cells; also removes repeated multi-megabyte typed-array churn.

Problem: Blood particles were rendered with one WebGL draw call and uniform set per particle, up to 256 calls in burst cases.
Solution: Converted particle rendering to WebGL2 instanced quads: one dynamic instance buffer for screen/depth data, one for color, one `drawArraysInstanced()` call per frame.
Rejected Alternatives: Lowering particle count alone would reduce the visual effect and only mask the draw-call problem.
Scalability potential: Low devices keep bounded particle bursts with one draw. Middle devices keep current counts. High and Ultra can afford dense gore bursts without draw-call scaling.
Hardware Impact: Estimated 300-2,500 us/frame saved during active blood bursts, depending on driver overhead.

Problem: Door-state texture upload allocated a fresh 1024x1024 byte array every frame.
Solution: Reused a persistent door-state buffer in `src/render/webgl.ts` and refilled it before upload.
Rejected Alternatives: Leaving per-frame allocation invites GC spikes exactly when effects are already active.
Scalability potential: All tiers keep dynamic doors; low and middle devices avoid avoidable allocation churn.
Hardware Impact: Estimated 100-700 us/frame saved in allocation/GC pressure, plus fewer long-tail stalls.
