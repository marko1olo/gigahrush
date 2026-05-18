# AGENT_02_SAMOSBOR_VARIANTS Status

Domain: Samosbor Variants / Fog Phenomena
Task count: 12

## Preflight

- [x] README.md read by CLI. DOD: command output inspected. Rejected: MCP-only read. Estimate: 1,000 us.
- [x] XML prompt extracted cover-to-cover by id `AGENT_02_SAMOSBOR_VARIANTS`. DOD: awk bounded by XML tags. Rejected: manual copy from neighboring prompts. Estimate: 1,000 us.
- [x] Mandatory docs/code read: `desdoc.md` sections 2, 6, 12, Epic B, 51; `src/systems/samosbor.ts`; `src/core/types.ts`; `src/render/hud.ts`; `src/render/map_ui.ts`; `src/gen/shared.ts`. DOD: direct CLI reads. Rejected: assumptions from README only. Estimate: 12,000 us.
- [x] Skill registry lookup attempted. DOD: `rg --files .agents-skills` and `find .. -name .agents-skills`. Rejected: inventing nonexistent local mandate files. Estimate: 2,000 us. Result: registry directory absent in this checkout.
- [x] Baseline `npm run build` recorded. DOD: Vite build completed. Rejected: building after edits only. Estimate: 566,000 us.

## Selected Mandates

1. Predictability over realism: each variant gets a readable player-facing signal.
2. Cinematic cheat protocol: fog tint, messages, timing and spawn weights before simulation.
3. Frame time dictatorship: no added per-cell frame loop beyond existing fog spread.
4. Parallel safe: no dependency on AG01 event bus or future files.
5. Math LOD: low through ultra behavior documented in rationale.
6. Domain boundary: edits limited to owned Samosbor/HUD/map/debug/README scope.

## Tasks

- [x] 1. Document baseline samosbor flow and exact touched functions. DOD: rationale names current flow and targets. Rejected: hidden behavioral rewrite. Estimate: 5,000 us.
- [x] 2. Create `SamosborVariantDef`. DOD: data module defines variant/runtime/modifier types. Rejected: inline literals in system update. Estimate: 18,000 us.
- [x] 3. Add MVP variants: classic, quiet, wet, electric, meat. DOD: five defs with gameplay signals. Rejected: cosmetic-only labels. Estimate: 25,000 us.
- [x] 4. Add at least 10 cheap modifiers. DOD: 11 modifier defs in registry. Rejected: particle or fluid simulation. Estimate: 20,000 us.
- [x] 5. Store selected variant on `GameState` with backward-compatible optional fields or local module state. DOD: local module state avoids save/schema churn. Rejected: widening shared `GameState` in `types.ts`. Estimate: 8,000 us.
- [x] 6. Modify `updateSamosbor` to choose/reset variant while preserving old intervals/floor differences. DOD: variant chosen at start and cleared at end; interval function unchanged. Rejected: replacing timer model. Estimate: 30,000 us.
- [x] 7. Make fog/spawn/seal behavior read variant numbers without new per-cell loops. DOD: duration/spawn/fog seed/fog spawn/seal use active runtime; only bounded seed loop changed. Rejected: full-map fog simulation. Estimate: 45,000 us.
- [x] 8. Add warning/player feedback. DOD: start messages, HUD variant label, minimap/full-map tint. Rejected: message spam every tick. Estimate: 28,000 us.
- [x] 9. Add debug force/cycle path. DOD: existing debug force command cycles next variant and starts samosbor. Rejected: editing `main.ts` for wider debug menu scope. Estimate: 12,000 us.
- [x] 10. Add floor-specific weighting/touches. DOD: Hell favors meat; Maintenance favors wet/electric; Living favors classic; Hell meat variant marks bounded seed textures. Rejected: floor enum changes. Estimate: 18,000 us.
- [x] 11. Update README with implemented facts only. DOD: documented implemented variants, effects, floor weighting, debug cycle. Rejected: roadmap claims. Estimate: 12,000 us.
- [x] 12. Run `npm run build`; fix own compile errors. DOD: final Vite build passes. Rejected: skipping final compile after README/code changes. Estimate: 630,000 us.

## Compile Log

- Baseline: PASS, `npm run build`, Vite 7.2.4, 117 modules, `dist/index.html` 529.84 kB, built in 566 ms.
- Batch 1 after tasks 1-5: PASS, `npm run build`, Vite 7.2.4, 117 modules, `dist/index.html` 529.84 kB, built in 609 ms.
- Batch 2 after tasks 6-10: PASS, `npm run build`, Vite 7.2.4, 136 modules, `dist/index.html` 578.66 kB, built in 593 ms.
- Final: PASS, `npm run build`, Vite 7.2.4, 138 modules, `dist/index.html` 606.27 kB, built in 630 ms.
- Polish: PASS, `npm run build`, Vite 7.2.4, 138 modules, `dist/index.html` 607.56 kB, built in 640 ms. `git diff --check` clean. Classic alarm verified: classic has no `no_siren`, and `playSamosborAlarm()` is gated only by `!variant.noSiren`.

## User Hotfix: Samosbor/Death Render Lag

- [x] 1. Inspect samosbor/death render paths. DOD: read `hud.ts`, `hud_fx.ts`, `webgl.ts`, `blood.ts`, `marks.ts`, `main.ts`. Rejected: guessing from user feedback only. Estimate: 18,000 us.
- [x] 2. Baseline compile before hotfix. DOD: `npm run build` PASS, Vite 7.2.4, 150 modules, `dist/index.html` 608.84 kB, built in 647 ms. Rejected: editing before verifying current build state. Estimate: 647,000 us.
- [x] 3. Replace fullscreen static per-block drawing with cached bitmap noise. DOD: `drawStaticNoise()` now refreshes a low-res ImageData cache at 12 Hz and blits scaled. Rejected: removing static visual. Estimate: 24,000 us.
- [x] 4. Stop rebuilding surface-mark atlas every frame. DOD: `World.surfaceVersion` dirty path drives atlas/index upload only on mark changes or camera tile overflow. Rejected: deleting blood/surface marks. Estimate: 38,000 us.
- [x] 5. Batch blood particles. DOD: WebGL2 particle path now uses instanced quads and one draw call for visible burst particles. Rejected: lowering visual count as the primary fix. Estimate: 45,000 us.
- [x] 6. Remove per-frame door-state allocation. DOD: reusable door-state buffer used by `updateDynamicData()`. Rejected: fresh 1 MB typed array each frame. Estimate: 12,000 us.
- [x] 7. Verify compile and whitespace. DOD: `npm run build` PASS three times after hotfix, latest built in 701 ms; `git diff --check` PASS. Rejected: relying on TypeScript editor inference. Estimate: 701,000 us.

Hotfix estimated frame savings:
- Fullscreen samosbor/death static: 3,000-12,000 us/frame on i3/MX350-class hardware at 1080p.
- Surface atlas dirty update: 1,500-6,000 us/frame after gore/death bursts with many marks.
- Instanced blood particles: 300-2,500 us/frame during particle bursts.
- Reused door-state buffer: 100-700 us/frame in allocation/GC pressure.

## Round 2: Aftermath Beats

- [x] Mandatory preflight read: `README.md`, `architecture.md`, `Docs/Expansions/00_samosbor_director/expansion.md`, `src/data/samosbor_variants.ts`, `src/systems/samosbor.ts`, `src/gen/floor_manifest.ts`, `src/render/hud.ts`, `src/render/map_ui.ts`, `src/systems/events.ts`. DOD: direct CLI reads before edits.
- [x] Baseline build recorded before edits. DOD: `npm run build` PASS, Vite 7.2.4, 171 modules, `dist/index.html` 734.43 kB, built in 729 ms.
- [x] Variant data fields documented in code shape: `SamosborVariantDef` owns id/name/floors/weight/fog color/tint/duration/spawn/seal warnings/modifiers/signal; `SamosborModifierDef` folds runtime multipliers; `ActiveSamosborVariant` is the built runtime view.
- [x] Runtime touch points documented: `updateSamosbor()` chooses/clears active variant; `captureZone()` seeds fog, boss and variant tags; spawn helpers read variant spawn rates; seal timing reads variant delta; map/HUD read active variant color/name; debug reads module state.
- [x] Added `SamosborAftermathBeatDef` table with 9 bounded beats: fog residue, door fault, tvar aftershock, electric eye, rumor seed, supply shortage, faction panic, container theft, false all-clear.
- [x] Hooked aftermath to post-rebuild application through module-local pending state. DOD: effects are not wiped by `rebuildWorld()` and run only after samosbor end.
- [x] Added cooldowns and hard caps per beat. DOD: module-local run history blocks repeat spam; classic gets only a rare single beat while non-classic variants try 2-3.
- [x] Added useful event tags. DOD: start/end events include `variant_*`; aftermath publishes `samosbor`, `aftermath`, effect id and variant tags with beat data.
- [x] Added debug visibility. DOD: debug overlay prints current variant, last variant, next forced variant, last aftermath beats and cooldown state.
- [x] README updated with shipped aftermath behavior only.

Round 2 verification:
- `npm run typecheck`: FAIL from existing unrelated dirty-tree errors; after cleanup no `src/systems/samosbor.ts`, `src/data/samosbor_variants.ts`, or `src/systems/debug.ts` errors remained.
- `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 1,004.04 kB, built in 1.09s.
- `npm run check`: FAIL at its typecheck stage on unrelated dirty-tree errors in `src/data/dialogue.ts` and `src/systems/rumor.ts`; tests/build/smoke did not run after the typecheck failure.
