# AGENT_02_SAMOSBOR_VARIANTS Log

## 2026-05-17 Samosbor Variants MVP

What was wrong:
- Samosbor had one readable mode only: fixed alarm, purple fog, fixed seal timing, fixed spawn behavior.
- HUD/map feedback could not tell the player which kind of samosbor was active.
- Debug could force samosbor but could not demonstrate non-classic variants.

What was done:
- Added `src/data/samosbor_variants.ts` with five variants: classic, quiet, wet, electric, meat.
- Added 11 cheap modifiers: no siren, delayed seal, early seal, dense fog, sparse fog, extra eyes, door twitch, light flicker, false safe-zone, wet floor message, meat walls on Hell.
- Wired active variant selection/reset into `updateSamosbor()` without changing old floor interval ranges.
- Applied variant numbers to active duration, spawn counts, fog seed radius/strength, fog spawn interval, and hermodoor seal threshold.
- Added HUD active-variant label and map fog tint using the selected variant color.
- Reused debug force command as `Цикл варианта + самосбор`, cycling forced variants and setting the timer to zero.
- Added floor weighting: Hell favors meat, Maintenance favors wet/electric, Living favors classic.
- Added bounded Hell meat texture marks for meat resonance in the existing fog seed radius.
- Updated README with implemented facts only.

Cinematic Cheats used:
- Messages and HUD labels carry most variant readability.
- Fog color is map/UI tint, not a volumetric simulation.
- Wet/electric/door/false-safe signals are warning text and timing multipliers.
- Meat resonance uses bounded texture marks near the seeded fog center, not dynamic wall deformation.

Exact Microseconds saved:
- Rejected particle/fluid fog simulation: estimated 1,000-4,000 us/frame saved on i3/MX350-class hardware.
- Rejected full-map per-frame variant scan: estimated 2,000-6,000 us/frame saved on 1024x1024 world.
- Cached map tint once per map draw instead of per-cell getter: estimated 150-600 us/full-map draw saved.
- Reused existing debug command instead of input/menu expansion: estimated 0 runtime us and avoided cross-file conflict.
- Bounded Hell meat marks to radius <= 7 at samosbor start: estimated 500-2,000 us/frame saved versus live wall mutation.

Verification:
- Baseline build: PASS, 566 ms.
- Batch 1 build after tasks 1-5: PASS, 609 ms.
- Batch 2 build after tasks 6-10: PASS, 593 ms.
- Final build after README: PASS, 630 ms.
- Polish build: PASS, 640 ms.
- `git diff --check`: PASS.
- Classic alarm verification: classic has no `no_siren`; `playSamosborAlarm()` still runs unless the active variant has `noSiren`.

Known constraints:
- Modifier effects stay intentionally cheap. Several modifiers are message/timing signals, not new simulators.
- Active variant state is module-local and not persisted; current load path already disables active samosbor on load.

## 2026-05-17 Samosbor/Death Render Lag Hotfix

What was wrong:
- Samosbor/death fullscreen static used canvas `fillRect` over the whole HUD every frame. At 1080p this is roughly 129,600 block draws per call.
- Blood/death marks forced `updateDynamicData()` to rebuild and upload the full surface atlas/index every frame, even when no mark changed.
- Blood particles used one WebGL draw call per particle, scaling driver work with gore burst size.
- Door-state upload allocated a fresh 1024x1024 byte array every frame.

What was done:
- Replaced static noise drawing with a cached low-resolution ImageData bitmap, refreshed at 12 Hz and scaled over the same region.
- Added `World.surfaceVersion`; `stampMark()` and cleaning bump it, and WebGL uploads surface marks only when dirty or when the camera tile changes after mark-slot overflow.
- Converted blood particles to WebGL2 instanced quads: one instance buffer, one color buffer, one draw call.
- Reused a persistent door-state buffer for dynamic uploads.
- Verified `npm run build` twice after hotfix and `git diff --check`.

Cinematic Cheats used:
- Static remains visually noisy but becomes a scaled cached texture, not live per-screen-block work.
- Blood remains as persistent surface marks; atlas rebuild is event-driven instead of frame-driven.
- Gore particles remain visible; batching changes submission cost, not the visual concept.

Exact Microseconds saved:
- Static noise cache: estimated 3,000-12,000 us/frame saved during samosbor/death fullscreen noise on i3/MX350-class hardware.
- Surface atlas dirty upload: estimated 1,500-6,000 us/frame saved after death/gore bursts with many surface marks.
- Instanced particles: estimated 300-2,500 us/frame saved during active blood bursts.
- Door-state buffer reuse: estimated 100-700 us/frame saved in allocation and GC pressure.

Verification:
- Pre-hotfix build: PASS, Vite 7.2.4, 150 modules, `dist/index.html` 608.84 kB, built in 647 ms.
- Post-hotfix build 1: PASS, Vite 7.2.4, 150 modules, `dist/index.html` 641.36 kB, built in 683 ms.
- Post-hotfix build 2: PASS, Vite 7.2.4, 150 modules, `dist/index.html` 641.36 kB, built in 690 ms.
- Final verification build: PASS, Vite 7.2.4, 156 modules, `dist/index.html` 684.37 kB, built in 701 ms.
- `git diff --check`: PASS.

Known constraints:
- No browser GPU timer query was available in this CLI pass; savings are code-path estimates based on removed draw calls, allocations, and atlas rebuild work.
- Fog texture still uploads as a full dynamic texture because fog density can change each tick; this remains the next render-budget target if users still report samosbor stalls.

## 2026-05-17 Round 2 Samosbor Aftermath Beats

What was wrong:
- Variant selection ended cleanly but non-classic variants did not leave bounded, inspectable consequences after rebuild.
- End events did not carry enough variant/aftermath tags for later event/rumor consumers.
- Debug showed the force command path but not current/last/forced variant state or aftermath cooldowns.

What was done:
- Added `SamosborAftermathBeatDef` data in `src/data/samosbor_variants.ts`.
- Added 9 aftermath beats: fog residue, door fault, tvar aftershock, electric eye, rumor seed, supply shortage, faction panic, container theft and false all-clear.
- Scheduled aftermath through pending module state and applied it from `rebuildWorld()` after the regenerated floor exists.
- Kept new cell/entity work local to the captured zone or player radius; economy shortage is a small existing resource-stock delta.
- Published start/end/aftermath events with `variant_*`, `samosbor` and `aftermath` tags plus beat ids in event data.
- Added debug overlay lines for current variant, previous variant, next forced variant, recent aftermath beats and cooldown.
- Updated README with shipped facts only and updated `Docs/Tasks/Status_AG02_SAMOSBOR.md` Round 2.

Verification:
- Baseline `npm run build`: PASS, 729 ms.
- `npm run typecheck`: FAIL on unrelated dirty-tree errors, with no remaining samosbor/data/debug errors after cleanup.
- Final `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 1,004.04 kB, built in 1.09s.
- `npm run check`: FAIL at typecheck on unrelated dirty-tree errors in `src/data/dialogue.ts` and `src/systems/rumor.ts`; later check stages did not run.
- `git diff --check` for touched AG02 files: PASS.

Known constraints:
- Aftermath runtime caps/cooldowns are module-local and not saved.
- `samosbor_warning` is reused for aftermath event publication because the current event type union lives in core types; consumers should filter `tags`/`data.beatId`.
