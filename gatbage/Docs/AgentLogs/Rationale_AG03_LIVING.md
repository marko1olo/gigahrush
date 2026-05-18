# AG03 Living Content Pack Rationale

## Decision 0 - Content Architecture

Problem: Living content must add POIs, NPCs, and quests without touching shared quest engine or adding new enums.

Solution: Use the existing DOD pattern: self-contained `src/gen/living/*.ts` modules with top-level `registerZoneContent` and `registerSideQuest` calls, plus minimal imports in `index.ts` and `side_quests.ts`.

Rejected Alternatives: Editing `PLOT_CHAIN`, adding `RoomType`, or modifying quest engine would expand shared surface and create collision risk with other agents.

Scalability potential: Low uses static stamped rooms and existing sprites. Middle keeps deterministic zone placement without search-heavy simulation. High/Ultra can spend saved cycles on denser world loot and renderer-side procedural effects already present.

Hardware Impact: Static generation only. Runtime frame impact estimated 0 us after load; generation work is bounded and outside frame-critical loops. Low-end i3/MX350 impact: no persistent per-frame cost.

## Decision 1 - Missing Registry Files

Problem: The prompt references `.agents-skills/` and `Docs/Actual Domains of Project.txt`, but they are not present in this checkout.

Solution: Use the extracted XML block's `Selected Mandates`, `Domain`, and `Absolute Write Scope` as local authority. Record the missing files in status for integrator visibility.

Rejected Alternatives: Searching outside the repo or inventing mandates would create unverifiable dependency on non-local state.

Scalability potential: No code effect.

Hardware Impact: No runtime effect.

## Decision 2 - Side Quest Type Limitation

Problem: The assignment requires `TALK` and `VISIT` side quests via `registerSideQuest`, but `src/systems/quests.ts` currently materializes only side `FETCH` and `KILL`.

Solution: Register `TALK` and `VISIT` side quest definitions in the content module so the registry sees them, and keep playable side content on the existing `FETCH`/`KILL` path. Do not edit the shared quest engine because AG03 write scope forbids it.

Rejected Alternatives: Editing `systems/quests.ts` would satisfy runtime behavior but violates the extracted absolute scope. Encoding TALK/VISIT as fake FETCH items would be dishonest data and harder to integrate later.

Scalability potential: Low devices keep zero extra runtime cost. Middle/High/Ultra can later enable registered TALK/VISIT definitions by extending the shared generator once by an owning agent.

Hardware Impact: Registry-only data has no frame cost. Estimated low-end i3/MX350 runtime gain versus engine workaround: avoids extra per-talk scan branches outside owned scope.

## Decision 3 - Zone Selection

Problem: New fixed zone ids must not collide with existing living content.

Solution: Use HUD zones 18, 24, 25, and 31 after rechecking existing registrations for 3, 7, and 12.

Rejected Alternatives: Random zone assignment would hurt deterministic discovery. Reusing existing zone ids would create module collision and overwrite risk.

Scalability potential: Fixed zones make low-tier navigation predictable and leave high-tier visual density localized.

Hardware Impact: Static zone lookup only. Estimated frame cost: 0 us.

## Decision 4 - Deterministic NPC Placement

Problem: Normal random side-quest NPC placement makes new quest givers hard to find in a 1024x1024 toroidal floor.

Solution: Spawn AG03 NPCs inside their stamped POIs during zone content generation, then provide a `side_quests.ts` fallback that only fills missing NPCs by scanning from the POI or fixed zone center.

Rejected Alternatives: Existing random FLOOR scan would satisfy compile but fail discoverability. A global registry dependency would couple to systems outside AG03 scope.

Scalability potential: Low devices do one bounded scan only at generation. Middle devices get stable POI discovery. High/Ultra can later add richer POI decoration without touching spawn logic.

Hardware Impact: No per-frame cost. Generation scan bounded to radius 48; estimated low-end i3/MX350 cost under 1000 us worst-case once per world generation.

## Decision 5 - Samosbor Protection

Problem: POIs should survive volatile rebuilds, but at least one must remain unsafe through its access path.

Solution: Protect stamped room interiors and wall rings with `aptMask`, but leave the common kitchen's south connector corridor unprotected. The room survives; the approach corridor can be wiped/rebuilt/fogged.

Rejected Alternatives: Leaving a permanent room unmasked would conflict with `zone_content` raising `apartmentRoomCount` and could leave stale room metadata after `wipeVolatile`.

Scalability potential: Low-tier keeps simple static shelter geometry. Middle/High/Ultra can use the volatile approach corridor for stronger samosbor drama without new systems.

Hardware Impact: `aptMask` checks happen in existing generation paths. Runtime frame cost: 0 us.

## Decision 6 - Visible Props Without New Renderer

Problem: POIs need visible authored props but AG03 cannot change renderer or sprite sheets.

Solution: Use existing `Feature` values plus existing `Spr.DESK` and `Spr.ITEM_DROP` entities. Use `world.stamp` for the common kitchen floor stain.

Rejected Alternatives: Adding renderer decals, new sprites, or new textures would exceed scope and risk collisions with rendering agents.

Scalability potential: Low devices render existing sprites and marks. Middle/High/Ultra can later increase density by adding more item drops or procedural marks without new systems.

Hardware Impact: Added static props are a handful of existing entities. Estimated low-end i3/MX350 frame impact is below 10 us in normal visibility due to existing sprite pipeline.

## Decision 7 - Build Result

Problem: Final work must compile after documentation and code changes.

Solution: Ran `npm run build` after all AG03 edits. Build passed.

Rejected Alternatives: Treating earlier compile as sufficient would miss README/import drift.

Scalability potential: No runtime design effect.

Hardware Impact: Build-time only. Runtime frame impact unchanged.

## Decision 8 - Polish Reachability Verification

Problem: Static code review is not enough to prove stamped rooms are reachable in the generated living floor.

Solution: Bundled `src/gen/living/index.ts` to `/tmp/ag03_living_bundle.mjs` with esbuild, ran `generateWorld()` in Node, and checked that all five AG03 room names exist, each has a corridor-floor adjacency, and all six AG03 plot NPCs exist.

Rejected Alternatives: Manual visual inspection or grep-only validation would not catch placement/connection misses.

Scalability potential: Verification is build-time only. Runtime design remains static and bounded.

Hardware Impact: No game runtime impact. Test generation found 9156 entities and 10436 rooms in the sampled world.
