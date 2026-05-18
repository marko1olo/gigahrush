# Status_UNASSIGNED

Task source: direct user request, no `CURRENT_BATCH.md` or `<AGENT_PROMPT>` found locally.
Domain: render/content, Living floor POI.
Task count: 1.

Relevant mandates identified before coding:
- Procedural assets only: no external nude imagery, no asset downloads.
- Visual additions are data-indexed: sprite IDs registered through `sprite_index.ts`.
- Content isolation: new POI lives in a new `src/gen/living/*.ts` module and is manifest-registered.
- Frame-time dictatorship: generation-time placement only, no per-frame scans or simulation.
- Tone boundary: non-pornographic, non-interactive, stylized art studies; no explicit sexual detail.

## Loop 1

- [x] Read `README.md`, `desdoc.md`, `architecture.md`, render sprite code, living content registry.
  - DOD practice: verified existing procedural sprite and zone-content patterns before writing code.
  - Rejected alternative: adding image files or external generated bitmap assets.
  - Estimate: 0 us/frame; read-only audit.

- [x] Confirmed no local `AGENTS.md`, `CURRENT_BATCH.md`, `.agents-skills/`, or domain file exists in this repo checkout.
  - DOD practice: CLI `find` over repo root before inventing IDs.
  - Rejected alternative: assuming one of the existing agent IDs.
  - Estimate: 0 us/frame.

## Loop 2

- [x] Add procedural art-nude sprite variants.
  - DOD practice: separate procedural generator file with four 64x64 variants.
  - Rejected alternative: explicit/photorealistic anatomy or external image assets.
  - Estimate: 0 us/frame; one-time startup generation.
- [x] Register sprite indices without hardcoded offsets.
  - DOD practice: `Spr.ART_NUDE_BASE` and named offsets in `sprite_index.ts`.
  - Rejected alternative: magic numeric sprite IDs inside content modules.
  - Estimate: 0 us/frame.
- [x] Verify static sprite entities remain non-pickup decorations.
  - DOD practice: reuse empty-inventory `ITEM_DROP` pattern already used by desks; pickup ignores empty inventory.
  - Rejected alternative: new `EntityType` and renderer branch.
  - Estimate: same draw cost as existing static desk sprite.

## Loop 3

- [x] Add a self-contained Living-floor art-study room.
  - DOD practice: new `src/gen/living/art_studies.ts` module with room, door, lamps, and four static sprites.
  - Rejected alternative: scattering adult art sprites globally in corridors.
  - Estimate: four extra local sprite draw calls only when visible.
- [x] Register it through the content manifest.
  - DOD practice: one side-effect import in `src/gen/living/content_manifest.ts`.
  - Rejected alternative: editing `generateWorld()` orchestration directly.
  - Estimate: 0 us/frame.
- [x] Keep placement generation-time only.
  - DOD practice: no update systems, no runtime scans, no AI hooks.
  - Rejected alternative: animated exhibit system or frame-based visibility logic.
  - Estimate: 0 us/frame beyond existing renderer.

## Loop 4

- [x] Update README/desdoc/agent logs concisely.
  - DOD practice: README records implemented files/behavior; desdoc current module list includes the new POI; rationale records the content boundary.
  - Rejected alternative: expanding the broad 18+ roadmap during a narrow sprite task.
  - Estimate: 0 us/frame.
- [x] Run TypeScript/Vite build.
  - DOD practice: `npm run build` completed through Vite/singlefile.
  - Rejected alternative: relying on TypeScript inference without compilation.
  - Estimate: build-time only.
- [x] Fix compile errors if any.
  - DOD practice: zero compile errors observed.
  - Rejected alternative: no-op because no compiler failure exists.
  - Estimate: 0 us/frame.

## Loop 5

- [x] Re-read touched code.
  - DOD practice: manually re-read sprite generator, sprite index, sprite sheet append, gallery module, and manifest import.
  - Rejected alternative: trusting first-pass edit after successful build.
  - Estimate: 0 us/frame.
- [x] Run final build.
  - DOD practice: second `npm run build` completed after re-read.
  - Rejected alternative: treating the first build as final after documentation/status edits.
  - Estimate: build-time only.
- [x] Append final report to `Docs/AgentLogs/LOG_UNASSIGNED.md`.
  - DOD practice: report contains wrong/done/cheats/microsecond accounting and verification.
  - Rejected alternative: chat-only reporting.
  - Estimate: 0 us/frame.

---

# Optimization Pass 2026-05-17

Task source: direct user request: create/update `optimization.md` and optimize safe code paths based on `README.md`, `desdoc.md`, and actual TypeScript code.
Domain: repo-wide runtime/render/AI/HUD performance.
Task count: 1.

Relevant mandates identified before coding:
- Frame-time dictatorship: remove per-frame allocations and GPU uploads where state is unchanged.
- Zero-GC runtime: avoid fresh objects/collections in hot loops.
- Predictability over realism: deterministic scan jitter instead of fresh random work every frame.
- Scalability pillar: low tier reduces CPU/GPU bus pressure; high/ultra keeps visuals unchanged.
- Evidence-based coding: build before/after and document measured/estimated impact.

## Optimization Loop 1

- [x] Read `README.md`, `desdoc.md`, `src/main.ts`, `src/render/webgl.ts`, `src/systems/ai/*`, `src/systems/samosbor.ts`, and HUD/map code.
  - DOD practice: hot-path audit against actual implementation before editing.
  - Rejected alternative: writing a generic `optimization.md` wishlist detached from code.
  - Estimate: 0 us/frame; audit only.
- [x] Confirmed `optimization.md` did not exist in repo.
  - DOD practice: CLI search from repo root.
  - Rejected alternative: assuming hidden or truncated MCP content.
  - Estimate: 0 us/frame.
- [x] Baseline build passes.
  - DOD practice: `npm run build` completed before edits.
  - Rejected alternative: optimizing on a broken baseline.
  - Estimate: build-time only.

## Optimization Loop 2

- [x] Add world dirty versions for wall/fog dynamic textures.
  - DOD practice: `World` now tracks wall/floor/fog dirty versions and runtime write sites mark changes.
  - Rejected alternative: chunked dirty rectangles across the full 1024x1024 world.
  - Estimate: saves roughly 50-200 us/frame on weak CPU/GPU paths when dynamic textures do not change.
- [x] Avoid unnecessary full WebGL dynamic uploads.
  - DOD practice: `updateDynamicData()` uploads wall/floor/fog textures only when versions change.
  - Rejected alternative: continuing unconditional 1 MB texture uploads per channel per frame.
  - Estimate: calm-frame transfer avoided is 2-3 MB/frame.
- [x] Preserve door-state rendering after runtime door/building changes.
  - DOD practice: cached door-state buffer uploads only on byte differences; structural tool edits call `updateWorldData()`.
  - Rejected alternative: door-state versioning across every direct `door.state` assignment.
  - Estimate: avoids 1 MB fill/upload on unchanged frames.

## Optimization Loop 3

- [x] Remove avoidable per-frame AI/renderer allocations.
  - DOD practice: AI entity lookup map and visible sprite records are reused.
  - Rejected alternative: broad spatial partition/instanced renderer rewrite in a safe pass.
  - Estimate: roughly 20-120 us/frame plus fewer GC spikes under dense entity counts.
- [x] Remove per-frame random scan interval generation from combat hot paths.
  - DOD practice: deterministic per-entity scan jitter keeps staggered scans without RNG churn.
  - Rejected alternative: synchronized fixed scan intervals for all combatants.
  - Estimate: micro-level CPU noise removed; behavior cadence preserved.
- [x] Replace HUD interaction sqrt scan with squared distance.
  - DOD practice: NPC prompt and nearby containers use `dist2`.
  - Rejected alternative: changing interaction radius or spatial behavior.
  - Estimate: small but hot UI/input-path saving.

## Optimization Loop 4

- [x] Create `optimization.md` with code-grounded findings, completed changes, and remaining safe opportunities.
  - DOD practice: document lists actual files changed, rejected alternatives, and safe next work.
  - Rejected alternative: prose-only recommendation without implemented code.
  - Estimate: 0 us/frame; documentation only.
- [x] Re-read touched hot paths.
  - DOD practice: inspected dynamic upload code, slide dirtying, samosbor fog writes, AI scan cache, sprite collection, HUD/map/container/pathfinding changes.
  - Rejected alternative: trusting build success alone.
  - Estimate: 0 us/frame; review only.
- [x] Run TypeScript/Vite build.
  - DOD practice: `npm run build` completed after optimization edits.
  - Rejected alternative: stopping after TypeScript-local reasoning.
  - Estimate: build-time only.

## Optimization Loop 5

- [x] Fix compile errors if any.
  - DOD practice: no compile errors after first optimization build.
  - Rejected alternative: no-op without verification.
  - Estimate: 0 us/frame.
- [x] Append rationale and final agent log.
  - DOD practice: `Rationale_UNASSIGNED.md` records texture/upload, allocation, and micro-hotpath decisions; `LOG_UNASSIGNED.md` records wrong/done/cheats/microsecond estimates.
  - Rejected alternative: chat-only optimization report.
  - Estimate: 0 us/frame.
- [x] Run final build.
  - DOD practice: final `npm run build` completed after documentation/status/log updates.
  - Rejected alternative: treating earlier build as final after writing reports.
  - Estimate: build-time only.

---

# Floor 69 Female NPC Sprite Bank 2026-05-17

Task source: direct user request: add procedural female NPC sprites for future floor 69, varying hair color.
Domain: render/content sprite bank.
Task count: 1.

Relevant mandates identified before coding:
- Procedural assets only: no external images.
- Visual additions are data-indexed through `sprite_index.ts`.
- No invented dependency on a non-existent FloorLevel 69 generator.
- Frame-time dictatorship: sprite bank only, no spawn/update systems.
- Tone boundary: art/stylized NPC sprites, no pornographic explicit details.

## F69 Loop 1

- [x] Re-read status/rationale and current sprite bank.
  - DOD practice: confirmed current `ART_NUDE_*` static decor and sprite-sheet ordering before edits.
  - Rejected alternative: reusing static decor IDs for future NPCs.
  - Estimate: 0 us/frame.

## F69 Loop 2

- [x] Add eight procedural female NPC variants with hair-color differentiation.
  - DOD practice: `F69_FEMALE_NPC_VARIANTS = 8`, seeded hair/skin/color drawing in `art_sprites.ts`.
  - Rejected alternative: one generic female sprite recolored at runtime.
  - Estimate: 0 us/frame until spawned.
- [x] Register stable sprite IDs.
  - DOD practice: `Spr.F69_FEMALE_NPC_BASE` and `Spr.F69_FEMALE_NPC_0..7`.
  - Rejected alternative: magic offsets from `Spr.ART_NUDE_BASE`.
  - Estimate: 0 us/frame.

## F69 Loop 3

- [x] Append variants to `generateSprites()`.
  - DOD practice: sprite sheet order matches `sprite_index.ts` append order.
  - Rejected alternative: adding a separate sprite sheet or renderer path.
  - Estimate: startup generation only.

## F69 Loop 4

- [x] Update README/desdoc/rationale/log.
  - DOD practice: documented that this is a sprite bank only, not floor generation.
  - Rejected alternative: implementing FloorLevel 69 in a sprite task.
  - Estimate: 0 us/frame.
- [x] Run TypeScript/Vite build.
  - DOD practice: `npm run build` completed with the expanded sprite sheet.
  - Rejected alternative: trusting sprite index math without compilation.
  - Estimate: build-time only.

## F69 Loop 5

- [x] Re-read touched sprite code.
  - DOD practice: checked `art_sprites.ts`, `sprite_index.ts`, and `sprites.ts` after edits.
  - Rejected alternative: assuming append-order correctness.
  - Estimate: 0 us/frame.
- [x] Run final build.
  - DOD practice: second `npm run build` completed after sprite/doc edits.
  - Rejected alternative: stopping after first compile pass.
  - Estimate: build-time only.

---

# Test And Playability Pass 2026-05-17

Task source: direct user request: "пиши тесты для всего что можешь ... собирай и тестируй игру".
Domain: repo-wide TypeScript unit tests, production build, browser smoke/playability.
Task count: 1.

Relevant mandates identified before coding:
- Evidence-based coding: add executable tests and run them, not prose-only claims.
- Frame-time dictatorship: test harness must stay outside runtime bundle and add 0 us/frame.
- Zero-GC runtime boundary: no new game-loop instrumentation or per-frame test hooks.
- Predictability over realism: unit tests should cover deterministic core/data contracts first.
- Scalability pillar: browser smoke verifies low-end-safe startup path while leaving high/ultra visuals unchanged.
- Anti-refactor loop: no broad rewrites; only add tests and fix failures exposed by tests/build/smoke.

## Test Loop 1

- [x] Re-read `Status_UNASSIGNED.md`, `Rationale_UNASSIGNED.md`, `README.md`, `architecture.md`, scripts, core world/types, event/economy/inventory/RPG systems, sprite registry, and browser entry startup.
  - DOD practice: checked project shape and current dirty worktree before edits.
  - Rejected alternative: adding a generic test framework without understanding current module boundaries.
  - Estimate: 0 us/frame; audit only.
- [x] Confirmed no local `CURRENT_BATCH.md`, `<AGENT_PROMPT>`, `.agents-skills/`, or domain file exists in this repo checkout.
  - DOD practice: CLI search from repo root and direct status/rationale review.
  - Rejected alternative: inventing a batch ID or Unity workflow.
  - Estimate: 0 us/frame.

## Test Loop 2

- [x] Add no-runtime-cost TypeScript unit test harness.
  - DOD practice: `tsconfig.test.json` emits CommonJS into ignored `.test-build/`; Node built-in `node:test` runs compiled tests.
  - Rejected alternative: adding Vitest/Jest/Playwright to runtime dependencies.
  - Estimate: 0 us/frame; test-only compile output.
- [x] Add deterministic core/system tests.
  - DOD practice: tests cover world wrap/doors/lights, event ring buffers, economy stock/prices, inventory/ammo/durability, RPG formulas, sprite registry alignment, and all floor generator spawn invariants.
  - Rejected alternative: only smoke-testing the browser and missing data contract regressions.
  - Estimate: 0 us/frame; generation tests run outside gameplay.
- [x] Run unit tests and fix compile/runtime failures.
  - DOD practice: `npm run test:unit` now passes 15/15 tests; the harness also forced strict source typechecking.
  - Rejected alternative: loosening failed sprite-registry assertion; the test was corrected to account for the later F69 sprite block while preserving sheet/registry validation.
  - Estimate: 0 us/frame; test-only.

## Test Loop 3

- [x] Add browser smoke/playability check against the built game.
  - DOD practice: `scripts/smoke-playability.mjs` starts Vite preview on a free local port, opens Chrome headless through CDP, presses Enter, holds W briefly, checks canvases/WebGL pixels, and fails on runtime exceptions.
  - Rejected alternative: `curl`-only smoke that proves HTML delivery but not playability.
  - Estimate: 0 us/frame; external smoke only.
- [x] Run production build.
  - DOD practice: `npm run build` passed through Vite singlefile output.
  - Rejected alternative: relying on dev server transpilation only.
  - Estimate: build-time only.
- [x] Run smoke/playability check and fix startup failures.
  - DOD practice: first smoke exposed headless WebGL2 unavailability with disabled GPU; script now uses SwiftShader/ANGLE and passes with nonblank HUD/WebGL samples.
  - Rejected alternative: skipping WebGL assertion in headless mode.
  - Estimate: 0 us/frame; Chrome test-only flags.

## Test Loop 4

- [x] Re-read touched test/scripts/package files.
  - DOD practice: re-read `package.json`, `tsconfig.test.json`, all test files, smoke script, README build commands, and diff surface.
  - Rejected alternative: trusting the passing check without reviewing the actual harness code.
  - Estimate: 0 us/frame; audit only.
- [x] Run full check sequence.
  - DOD practice: `npm run check` passed: typecheck, 15 unit tests, Vite build, and Chrome smoke.
  - Rejected alternative: separate partial command reports with no final integrated gate.
  - Estimate: build/test-time only.
- [x] Update rationale with decisions and hardware impact.
  - DOD practice: recorded native test harness, Chrome CDP smoke, and sprite-registry boundary decisions in `Rationale_UNASSIGNED.md`.
  - Rejected alternative: chat-only explanation.
  - Estimate: 0 us/frame.

## Test Loop 5

- [x] Append final report to `Docs/AgentLogs/LOG_UNASSIGNED.md`.
  - DOD practice: report records wrong/done/cheats/microsecond accounting and exact verification results.
  - Rejected alternative: final chat-only report.
  - Estimate: 0 us/frame.
- [x] Run final build/test/smoke verification.
  - DOD practice: final `npm run check` completed successfully after README/status/rationale updates.
  - Rejected alternative: stopping after earlier standalone `npm run smoke`.
  - Estimate: build/test-time only.
- [x] Leave generated test output outside tracked source.
  - DOD practice: `.test-build/` is ignored and recreated by `npm run test:unit`; Chrome profile lives in OS temp and is deleted.
  - Rejected alternative: committing compiled test output or browser profile state.
  - Estimate: 0 us/frame.
