# Rationale_ARCHITECTURE

Problem: The user requested a modular architecture plan, while the pasted protocol references Windows/Unity-style paths and a missing local mandate registry.
Solution: Use the actual repository as authority: TypeScript/Vite singlefile raycaster, typed-array world, definition-driven data files, floor generators, content registries, and fixed-size world event buffers.
Rejected Alternatives: Inventing absent `.agents-skills` rules, converting the project to Unity, or pretending `CURRENT_BATCH.md` exists.
Scalability potential: Low, Middle, High, Ultra devices benefit because the plan keeps new content static/data-driven and reserves per-frame work for existing systems.
Hardware Impact: i3/MX350 estimate 0.00 ms/frame for documentation-only work; the planned architecture targets 0-100 us/frame per new system by default, with generation-time or slow-tick costs preferred.

Problem: Parallel content agents currently collide on floor `index.ts`, central enums, and large registries such as `ITEMS`, `PLOT_NPCS`, `MONSTERS`.
Solution: Document additive ownership lanes: module-owned files, small registries, manifest/import seams, string-id definitions where possible, and integrator-owned central enum changes.
Rejected Alternatives: Every agent editing `main.ts`, `types.ts`, `shared.ts`, and `catalog.ts` directly; this would create merge conflicts and hidden behavioral coupling.
Scalability potential: Toaster keeps cheap modules and sparse ticks; middle/high/ultra can enable denser content, more visual variants, and richer debug overlays without changing module contracts.
Hardware Impact: Avoided merge churn and hot-loop feature creep; expected runtime savings versus naive per-content update loops are roughly 100-500 us/frame on i3/MX350 once the rules are followed.

Problem: The architecture needed to maximize content throughput without forcing a refactor loop.
Solution: Document the current layer contract and assign green/yellow/red file ownership. Keep `core`, `main`, `shared`, and renderer integration red; make new floor/content/data files green.
Rejected Alternatives: Introducing an abstract plugin engine immediately, moving existing content to a new folder structure, or requiring automatic file discovery before it is needed.
Scalability potential: Low tier keeps generated/static content cheap; middle/high/ultra tiers can add denser procedural marks, variants, and debug views while preserving the same content module contract.
Hardware Impact: Documentation-only change adds 0 us/frame. If followed, central hot-loop edits should remain rare; expected low-end frame protection is 100-500 us/frame compared with independent per-agent update loops.

Problem: Agents need a decoupling mechanism, but this repo does not have Unity `NativeQueue` or a `GlobalRegistry` implementation.
Solution: Treat `systems/events.ts` as the active EventBus analogue and recommend small TypeScript registries for data domains. New systems communicate through ids and `publishEvent`.
Rejected Alternatives: Adding a new bus layer in this task or requiring direct imports between content modules.
Scalability potential: Low tier gets bounded ring buffers and string ids; higher tiers can add richer event consumers without changing producers.
Hardware Impact: Fixed-size buffers cap memory and avoid unbounded log growth; expected impact remains below 0.1 ms/frame if consumers query on slow ticks.

Problem: The first architecture pass was a contract, but parallel agents still needed executable seams to stop editing floor orchestrators.
Solution: Add `content_manifest.ts` files for active content floors and `floor_manifest.ts` for central floor generation/name/color mapping. Preserve generator order and signatures through runner adapters.
Rejected Alternatives: Vite eager glob auto-loading would remove more imports but changes the build typing surface; rewriting all content modules to a universal interface would be a refactor loop.
Scalability potential: Low tier gets identical runtime behavior; middle/high/ultra content agents can add ordered content in manifests without touching `main.ts` or floor topology.
Hardware Impact: Manifest calls add 0 measurable per-frame cost; generation-time adapter overhead is estimated below 100 us per floor generation on i3/MX350.

Problem: Save/load generation handled only part of the six-floor enum and could route saved KVARTIRY/VOID games through the wrong generator.
Solution: Use `generateFloor(floor)` from `src/gen/floor_manifest.ts` in init, lift switching, portal entry, load, and non-LIVING samosbor rebuild.
Rejected Alternatives: Duplicating new switch branches in every caller; that would repeat the same bug on the next floor.
Scalability potential: Low/Middle/High/Ultra all benefit from one floor registry; future floors add one generator entry.
Hardware Impact: Runtime cost is one table lookup during generation/rebuild only; 0 us/frame.

Problem: New floor manifests duplicated the same `entities.reduce(...)+1` id-sync helper.
Solution: Add `syncNextEntityId()` in `src/gen/content_manifest_utils.ts` and use it from manifest runners only.
Rejected Alternatives: Refactoring all existing generators to a new context object; too broad and unnecessary while the game works.
Scalability potential: Low/Middle/High/Ultra benefit indirectly because future content manifests copy one helper import instead of reimplementing id math.
Hardware Impact: Same O(entity count) sync points as before; 0 us/frame, generation-only cost unchanged.

Problem: Floor-specific samosbor timer ranges were duplicated in `main.ts` and `systems/samosbor.ts`.
Solution: Move entry and post-samosbor timer functions into `src/gen/floor_manifest.ts`, preserving exact existing ranges, including the different VOID entry/post behavior.
Rejected Alternatives: Normalizing all timers to one policy would be cleaner but changes game balance; not allowed under the current "100% improves only" constraint.
Scalability potential: Future floors now add timer policy beside generator/name/color, reducing drift.
Hardware Impact: One function call on floor entry or samosbor end only; 0 us/frame.

Problem: Floor eligibility for faction reinforcements was repeated in `main.ts` as raw enum comparisons.
Solution: Add `allowsFactionEntryReinforcements()` and `allowsAmbientFactionReinforcements()` to `src/gen/floor_manifest.ts`, preserving the exact old conditions.
Rejected Alternatives: Moving faction spawning calls out of `main.ts`; that changes system order risk and needs play verification.
Scalability potential: Future floors now declare their reinforcement policy in one floor manifest instead of hunting through game-loop branches.
Hardware Impact: Same branch cost, 0 us/frame measurable; improves maintainability only.
