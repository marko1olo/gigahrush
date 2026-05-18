# Rationale_UNASSIGNED

## Decision 1: Adult Artistic Sprite Boundary

Problem: User requested nude female procedural sprites with 18+ caution, explicitly aesthetic and non-pornographic.

Solution: Implement stylized, low-resolution art-study/statue sprites with abstract silhouettes, classical contrapposto/standing poses, gallery context, no explicit genital or sexual anatomical detail, no interaction, no loot, no NPC behavior.

Rejected Alternatives: Photorealistic generated images, explicit anatomy, animated characters, hostile/lootable NPCs, or pin-up poster presentation. These would violate the user's stated non-pornographic intent and add content risk without gameplay value.

Scalability potential: Low tier uses a few precomputed 64x64 sprites at startup; Middle/High/Ultra tiers get room identity through lighting, wall art, and multiple variants without runtime cost.

Hardware Impact: Estimated low-end i3/MX350 impact is 0 us/frame beyond ordinary sprite draw calls already used by desks. Startup generation is sub-millisecond scale for four 64x64 arrays.

## Decision 2: Static Decor As Empty ITEM_DROP

Problem: Existing renderer only draws `Entity` sprites; adding a new render-only entity type would touch core, AI, inventory, save, and renderer boundaries.

Solution: Reuse the established empty-inventory `EntityType.ITEM_DROP` pattern already used for desks. Pickup code ignores empty inventory drops, so this is a render-only decoration with no gameplay surface.

Rejected Alternatives: New `EntityType.DECOR`, new `Feature.ART_STATUE`, or wall-texture-only implementation. The first two are broader red-file changes; the last ignores the user's request for sprites.

Scalability potential: Low uses 3-4 static sprites; Middle/High/Ultra can increase count per gallery or add variants without per-frame systems.

Hardware Impact: Same cost class as existing desk sprites. Four extra visible entities in one POI only; no global update loop.

## Decision 3: Gallery POI Instead Of Adult NPC System

Problem: `desdoc.md` contains future 18+ social-system ideas, but the user's direct request asked for aesthetic, non-pornographic nude women, not a full club/sex-work economy.

Solution: Add a small Living-floor art-study gallery with four static adult figure-study sprites. This gives the sprites a world context and avoids turning nude visuals into loot, combat targets, or fan-service NPCs.

Rejected Alternatives: Implementing sex-worker NPCs, club mechanics, stockings/accessory variants, or explicit anime pin-up sprites in this pass. Those require faction/social/economy design and would exceed the narrow render/content task.

Scalability potential: Low tier keeps the room as four static studies. Middle tier can add more wall art. High and Ultra can add curated lighting, mirror tricks, or additional non-explicit variants without changing AI.

Hardware Impact: Room generation is one-time. Runtime cost is four static billboards only when the gallery is visible; low-end i3/MX350 expected frame impact remains below measurable budget in ordinary play.

## Decision 4: Versioned Dynamic Texture Uploads

Problem: `updateDynamicData()` uploaded full 1024x1024 `wallTex`, `fog`, and door-state textures every rendered frame, even when walls, fog, or doors were unchanged.

Solution: Add cheap dirty/version tracking for wall and fog texture state, and compare packed door-state bytes before uploading. Full world uploads still happen after structural changes and floor rebuilds.

Rejected Alternatives: Chunked world textures or partial texSubImage rectangles. They are faster in theory but require broad write-site discipline across generation, tools, samosbor, and future agents.

Scalability potential: Low tier avoids redundant CPU-to-GPU bandwidth in calm frames. Middle tier benefits during ordinary exploration. High and Ultra keep all visual features unchanged and spend saved budget on existing fog/marks/sprite overdraw.

Hardware Impact: Estimated low-end i3/MX350 savings in calm gameplay: roughly 0.05-0.20 ms/frame from skipping 2-3 MB/frame of redundant texture traffic plus a 1 MB door buffer fill.

## Decision 5: Hot-Loop Allocation Removal

Problem: AI rebuilt a `Map` every frame, the WebGL sprite pass allocated one object per visible entity each frame, and combat scan intervals used fresh random values in per-entity update paths.

Solution: Reuse the entity lookup map, reuse sprite visibility records, and use deterministic per-entity scan interval jitter. Combat cadence stays staggered without per-frame RNG churn.

Rejected Alternatives: Spatial partitioning, instanced sprite atlas, or rewriting combat targeting. Those are larger architectural changes and risk behavior drift during a safe optimization pass.

Scalability potential: Low tier reduces GC pressure and frame spikes with many NPCs/monsters. Middle tier gets smoother dense fights. High and Ultra preserve current entity counts and can raise content density later.

Hardware Impact: Estimated low-end i3/MX350 savings: roughly 0.02-0.12 ms/frame plus fewer GC spikes, depending on visible sprite count and active combatants.

## Decision 6: Native Test Harness Instead Of Heavy Test Framework

Problem: The project had Vite build scripts but no automated tests; Vite transpilation alone can miss TypeScript contract errors and runtime regressions.

Solution: Add `tsconfig.test.json` plus Node's built-in `node:test` runner. Tests compile into ignored `.test-build/` as CommonJS so extensionless project imports execute under Node without a bundler.

Rejected Alternatives: Vitest/Jest/browser test framework dependency. Those add install weight and another execution layer when the current need is deterministic core/data/system coverage.

Scalability potential: Low tier pays 0 runtime cost because tests are outside the game bundle. Middle/High/Ultra keep the same bundle; future agents can add tests without touching runtime systems.

Hardware Impact: Estimated low-end i3/MX350 frame impact is 0 us/frame. Full unit pass is build-time only, about 8 seconds here with all six floor generators included.

## Decision 7: Built-Game Smoke Through Chrome CDP

Problem: `npm run build` proves bundling, not that the game is playable after load. The title screen, Enter start path, WebGL2 context, and first movement frame were unverified.

Solution: Add `scripts/smoke-playability.mjs` using Vite preview, Chrome headless, CDP input dispatch, runtime exception capture, HUD canvas sampling, and WebGL pixel sampling. Chrome uses SwiftShader/ANGLE so the smoke works without a discrete GPU.

Rejected Alternatives: `curl`-only smoke, screenshot-only manual check, or disabling WebGL assertions in headless mode. Those miss the exact failure class that makes the game unplayable.

Scalability potential: Low tier validates the cheapest startup path with software WebGL. Middle/High/Ultra keep full visuals unchanged; smoke only asserts nonblank rendering and input progress, not a fixed frame image.

Hardware Impact: Estimated low-end i3/MX350 runtime impact is 0 us/frame. Smoke-only `readPixels` causes Chrome test warnings and is deliberately not part of gameplay.

## Decision 8: Sprite Registry Test Boundary

Problem: Initial sprite alignment assertion assumed art-study sprites were the final sheet block, but the current registry also reserves an F69 female NPC sprite bank after them.

Solution: Keep the hard sheet-length assertion and validate both contiguous blocks: art-study block starts at `ART_NUDE_BASE`, F69 block follows it, and `F69_FEMALE_NPC_7 + 1 === Spr.TOTAL`.

Rejected Alternatives: Removing the registry test or accepting only `sprites.length === Spr.TOTAL`. That would miss block-order regressions and future out-of-range sprite ids.

Scalability potential: Low tier remains protected against blank/missing sprite reads. Middle/High/Ultra can add future sprite banks by extending explicit contiguous-block assertions.

Hardware Impact: Estimated low-end i3/MX350 frame impact is 0 us/frame. The check is unit-test only and prevents runtime missing-sprite stalls or invisible billboards.

## Decision 6: Micro-Hotpath Math Without Behavior Drift

Problem: Several frequent paths used unnecessary square roots, modulo wrapping, or linear id lookup while preserving simple gameplay logic.

Solution: Replace HUD/container radius checks with squared distance, replace BFS neighbor modulo wrapping with branch wrapping, and use `containerById` for direct production container lookup.

Rejected Alternatives: Changing interaction radii, pathfinding limits, or production/container semantics. Those would risk functionality changes instead of pure cost reduction.

Scalability potential: Low tier receives cheaper input/HUD/pathfinding work. Middle tier benefits in dense NPC pathfinding. High and Ultra preserve current behavior and can spend saved budget on more entities or denser content later.

Hardware Impact: Estimated low-end i3/MX350 savings: roughly 5-40 us/frame in ordinary play, higher during pathfinding bursts.

## Decision 7: Floor 69 Female NPC Sprite Bank Only

Problem: User asked for female NPC sprites for future floor 69, with procedural differences by hair color.

Solution: Add eight female NPC sprite variants to the existing procedural sprite bank and expose stable `Spr.F69_FEMALE_NPC_*` IDs. The sprites are render-ready for future NPC definitions but do not spawn, animate, trade, fight, or create a new floor.

Rejected Alternatives: Creating FloorLevel 69 now, adding sex-worker NPC behavior, or wiring adult social mechanics. Those are system/content design tasks and would collide with the current floor architecture.

Scalability potential: Low tier stores eight 64x64 sprites once at startup. Middle, High, and Ultra can reuse the same sprite bank for denser 69-floor crowds later without adding render code.

Hardware Impact: Startup generation only. Recurring cost is 0 us/frame until a future generator actually spawns entities using these sprite IDs.
