# AG30 Content QA Status

Date: 2026-05-17

## Scope

Audit content reachability and registry health after the current multi-agent batch. Keep fixes narrow: manifests, registry typos, deterministic checks, and factual docs only.

## Checklist

- [x] Extracted `AGENT_30_CONTENT_QA_REACHABILITY` prompt block.
- [x] Read `README.md`, `architecture.md`, and `audit.md`.
- [x] Listed current `Docs/AgentPrompts/*.md` names.
- [x] Read required manifests and registries: floor `content_manifest.ts`, `plot.ts`, `items.ts`, `contracts.ts`, `rumors.ts`, `entities/monster.ts`.
- [x] Baseline `npm run build` passed: `dist/index.html` 752.96 kB, gzip 232.19 kB, built in 892 ms.
- [x] Counted side quests, plot NPCs, contracts, item ids, monster kinds, variants, rumors, and manifest entries with `node scripts/content-audit.mjs`.
- [x] Detected duplicate ids and missing item/NPC/monster/room references: audit clean after fixes.
- [x] Spotted content modules not imported by a manifest/spawner: none detected in current tree.
- [x] Listed LIVING HUD zone ids and duplicate collisions: 14 registered zone entries, no duplicates.
- [x] Verified plot-chain references: 16 plot-chain steps resolve under registry test.
- [x] Added deterministic registry check: `scripts/content-audit.mjs` plus `tests/content-registry.test.ts`.
- [x] Fixed obvious local registry typos: rumor reveals for `idol_chernobog` and `psi_strike`; test pseudo-item handling for `money`.
- [x] Run `npm run check`: passed. Build `dist/index.html` 1,008.44 kB, gzip 305.46 kB, built in 1.26 s. Smoke passed with `hudLit=36864`, `webglLit=1024`.
- [x] Appended final compact report to `Docs/AgentLogs/LOG_AG30_QA.md`.

## Final Audit Counts

From `node scripts/content-audit.mjs` after validation:

| Registry | Count |
| --- | ---: |
| Plot NPC ids | 101 |
| Plot chain steps | 16 |
| Side quest steps | 105 |
| Contracts | 38 |
| Item ids | 188 |
| Monster kinds / monster registry entries | 22 / 22 |
| Monster variants | 20 |
| Rumors | 146 |
| Content manifest entries | hell 2, kvartiry 13, living 10, maintenance 16, ministry 8, void 2 |

## LIVING Zone IDs

`3`, `7`, `12`, `13`, `14`, `18`, `24`, `25`, `31`, `32`, `38`, `39`, `42`, `46`. No duplicate HUD zone collisions detected.
