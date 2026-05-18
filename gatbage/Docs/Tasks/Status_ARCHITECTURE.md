# Status_ARCHITECTURE

Agent ID: ARCHITECTURE
Domain: Architecture Planning
Assignment: Create root `architecture.md` from actual project code/docs so parallel agents can add large amounts of content with low edit contention.

## Local Source State

- Local `.agents-skills/`, `AGENTS.md`, `CURRENT_BATCH.md`, and `Docs/Actual Domains of Project.txt` are absent in this checkout.
- Active source of truth used: `README.md`, `desdoc.md`, `src/core/*`, `src/data/*`, `src/gen/*`, `src/systems/*`, current agent logs/status files.
- Selected mandates from available docs:
  - One module = one purpose.
  - Definition-driven/data-first extension.
  - README is implementation fact; `desdoc.md` is direction.
  - Respect toroidal coordinates and current floor model.
  - No new dependency or framework unless unavoidable.
  - Avoid hot-loop bloat; generation/static fakes over per-frame simulation.
  - Content must be visible in gameplay/debug and tied to samosbor/A-Life/factions when relevant.
  - Parallel agents use additive modules and registries, not shared-system rewrites.

## Checklist

- [x] 1. Inspect requested docs and package shape. DOD: read `README.md`, `desdoc.md`, `package.json`, source tree. Rejected: writing from prompt assumptions. Estimate: 5200 us.
- [x] 2. Inspect core runtime contracts. DOD: read `types.ts`, `world.ts`, main loop/floor switching, event store. Rejected: proposing Unity/NativeQueue architecture not present in this TypeScript project. Estimate: 8600 us.
- [x] 3. Inspect content extension patterns. DOD: read `zone_content.ts`, `side_quests.ts`, floor orchestrators, `plot.ts`, samosbor variants. Rejected: central monolithic content dump. Estimate: 9100 us.
- [x] 4. Draft `architecture.md`. DOD: root architecture document covers module lanes, ownership, registries, data-oriented rules, conflict avoidance, verification. Rejected: generic clean architecture boilerplate. Estimate: 22000 us.
- [x] 5. Verify document against code and run build. DOD: checked full document with `sed`, ran `npm run build` successfully in 663 ms. Rejected: fake compile report. Estimate: 18000 us.
- [x] 6. Implement executable manifest seams. DOD: added `src/gen/floor_manifest.ts` plus floor content manifests for LIVING, MAINTENANCE, MINISTRY, KVARTIRY, HELL. Rejected: Vite glob auto-loading before type contract work. Estimate: 34000 us.
- [x] 7. Harden existing registries. DOD: duplicate warnings and snapshots for side quests and LIVING zone content; ordered side quest spawner array. Rejected: central plugin framework. Estimate: 14000 us.
- [x] 8. Verify TypeScript hygiene. DOD: `npm run build` passed in 760 ms; `npx tsc --noEmit` passed. Rejected: relying only on Vite transpilation. Estimate: 20000 us.
- [x] 9. Remove manifest-local next-id duplication. DOD: added `src/gen/content_manifest_utils.ts` and replaced identical helper copies in floor manifests. Rejected: touching all older generators. Estimate: 9000 us.
- [x] 10. Centralize floor samosbor timer policy. DOD: moved entry/post-samosbor floor timer ranges into `src/gen/floor_manifest.ts`, preserved previous ranges, and verified `npm run build` in 774 ms plus `npx tsc --noEmit`. Rejected: changing balance or initial LIVING timer. Estimate: 11000 us.
- [x] 11. Name floor faction-entry reinforcement policy. DOD: replaced duplicate `floor !== HELL` entry patrol checks with `allowsFactionEntryReinforcements()`. Rejected: changing which floors receive patrols. Estimate: 5000 us.
- [x] 12. Name floor ambient reinforcement policy. DOD: replaced duplicate `floor !== HELL && floor !== KVARTIRY` checks with `allowsAmbientFactionReinforcements()`. Rejected: moving faction spawning out of `main.ts`. Estimate: 5000 us.

## Iterative Loops

- Loop 1 complete: source discovery, missing registry recorded.
- Loop 2 complete: current runtime boundaries mapped.
- Loop 3 complete: existing content registry patterns mapped.
- Loop 4 complete: `architecture.md` drafted against current TypeScript/Vite codebase, not imported Unity architecture.
- Loop 5 complete: `npm run build` passed; final log appended.
- Loop 6 complete: executable floor/content manifests added and load/save floor generation centralized.
- Loop 7 complete: registry duplicate guards/snapshots added.
- Loop 8 complete: Vite build and TypeScript no-emit checks pass.
- Loop 9 complete: manifest helper duplication removed.
- Loop 10 complete: floor timer policy centralized; Vite build and TypeScript no-emit checks still pass.
- Loop 11 complete: faction reinforcement floor policies named and centralized.
- Loop 12 complete: no further safe refactor chosen; next candidates require gameplay-level verification.
