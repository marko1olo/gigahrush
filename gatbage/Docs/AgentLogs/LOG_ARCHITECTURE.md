# LOG_ARCHITECTURE

## 2026-05-17

Started architecture planning task.

What was wrong: No root `architecture.md` existed. Existing docs describe many content patterns, but there was no compact operational contract for parallel agents to add content without edit contention.

What was done: Source discovery completed. Actual architecture confirmed as TypeScript/Vite, procedural raycaster, typed-array world, `src/data` definitions, `src/gen/<floor>` generators, `src/systems` runtime loops, and current registry examples in `zone_content.ts`, `side_quests.ts`, `plot.ts`, `samosbor_variants.ts`, and `events.ts`.

Cinematic Cheats used: None yet; architecture will prefer static room stamps, procedural textures, ring buffers, slow ticks, and visual-state fakes instead of per-frame physical simulation.

Exact Microseconds saved: 0 us/frame from docs alone. Estimated future saving if agents follow the architecture: 100-500 us/frame versus adding independent per-content update loops.

## 2026-05-17 Completion

What was wrong: The project had strong local patterns but no single root contract for parallel content expansion. The main conflict risks were central file edits (`main.ts`, `types.ts`, floor `index.ts`, `monster.ts`, `items.ts`) and agents adding per-frame bespoke systems for content.

What was done: Added root `architecture.md` with current fact map, invariants, layer contract, file ownership lanes, registry pattern, manifest strategy, data-oriented runtime rules, content module contract, system contract, EventBus usage through `publishEvent`, floor architecture, scalability tiers, cinematic cheat policy, telemetry expectations, verification checklist, anti-patterns, and phased growth plan.

Cinematic Cheats used: The architecture mandates fog/color/HUD/spawn fakes over volumetric simulation, static water/steam room states over fluid simulation, slow economy ticks over live micro-simulation, and procedural texture/mark overkill instead of imported asset bloat.

Exact Microseconds saved: 0 us/frame from this documentation patch. Expected future savings: 100-500 us/frame on i3/MX350 when agents avoid independent per-content update loops and full-world scans. Build verification: `npm run build` passed, Vite built 138 modules in 663 ms, output `dist/index.html` 608.15 kB gzip 189.77 kB.

## 2026-05-17 Modular Implementation

What was wrong: The architecture document recommended manifests, but the code still forced agents into shared floor orchestrators and duplicated floor generation switches. Save/load also did not generate all six floors through one matrix.

What was done: Added `src/gen/floor_manifest.ts`; added floor content manifests for LIVING, MAINTENANCE, MINISTRY, KVARTIRY, and HELL; moved existing additive content calls behind these seams; centralized floor name/color/generator mapping; added duplicate-id warnings and snapshot helpers for side quest and LIVING zone content registries; converted side quest spawning to an ordered spawner array.

Cinematic Cheats used: None in runtime visuals; architecture preserves current static/procedural content path and avoids new simulation loops.

Exact Microseconds saved: 0 us/frame directly. Estimated future savings: 100-500 us/frame from avoiding per-content frame loops and central switch duplication. Verification: `npm run build` passed in 760 ms; `npx tsc --noEmit` passed.

## 2026-05-17 Conservative Modular Pass

What was wrong: After manifest extraction, new manifests still repeated id-sync helper code and floor samosbor timer policy remained duplicated between lift switching and samosbor end logic.

What was done: Added `src/gen/content_manifest_utils.ts` with `syncNextEntityId()` and updated manifest runners to use it. Added `nextFloorEntrySamosborTimer()` and `nextPostSamosborTimer()` to `src/gen/floor_manifest.ts`, then replaced duplicated timer branches in `main.ts` and `systems/samosbor.ts`.

Cinematic Cheats used: None. This pass is structural only.

Exact Microseconds saved: 0 us/frame. Generation-time code is slightly less duplicated; expected runtime delta is 0 us/frame. Verification: `npm run build` passed in 774 ms; `npx tsc --noEmit` passed.

## 2026-05-17 Floor Policy Naming Pass

What was wrong: Floor-specific faction reinforcement eligibility was repeated in `main.ts` as raw enum checks, making future floor additions easier to get wrong.

What was done: Added `allowsFactionEntryReinforcements()` and `allowsAmbientFactionReinforcements()` to `src/gen/floor_manifest.ts`, then replaced duplicate call-site conditions in `main.ts`. No spawning order, floor eligibility, spawn count, or runtime cadence changed.

Cinematic Cheats used: None. Structural pass only.

Exact Microseconds saved: 0 us/frame. Verification: `npm run build` passed in 754 ms; `npx tsc --noEmit` passed.
