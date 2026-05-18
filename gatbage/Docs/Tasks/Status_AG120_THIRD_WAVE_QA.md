# AG120 Third-Wave QA Status

Prompt: `AGENT_120_THIRD_WAVE_QA_AUDIT`

Timestamp: 2026-05-18 02:21 BST

## Preflight

- [x] Extracted the XML block from `Docs/AgentPrompts/AGENT_120_THIRD_WAVE_QA_AUDIT.md`.
- [x] Read `README.md`, `architecture.md`, `desdoc.md`, `scripts/content-audit.mjs`, `tests/content-registry.test.ts`, and `package.json`.
- [x] Read active prompt summaries for `AGENT_60` through `AGENT_119`.
- [x] Read present AG61-AG119 status/log evidence.
- [x] Ran baseline `find Docs/AgentPrompts -maxdepth 1 -name 'AGENT_*.md' | sort`.

## Coverage Counts

- Prompt files: 90 total; AG61-AG119 prompt coverage is 59/59.
- Status files AG61-AG119: 53/59 present. Missing: AG99, AG103, AG107, AG109, AG111, AG119.
- Logs AG61-AG119: 37/59 present. Missing: AG69, AG75, AG80, AG81, AG84, AG96, AG98, AG99, AG100, AG103, AG105, AG106, AG107, AG108, AG109, AG111, AG112, AG113, AG114, AG116, AG117, AG119.
- Keyword-matched third-wave source modules: 47 candidate files under `src/`.
- Content audit final counts: 240 item ids, 200 plot NPC ids, 246 side quest steps, 67 contracts, 24 monster registry entries, 23 monster variants, 297 rumors, 8 slime defs, 3 zhelemish defs.

## Fixed

- Extended `scripts/content-audit.mjs` to:
  - resolve computed item keys from local string constants;
  - include `CHERNOBOG_DOCKET_ITEMS` spread ids;
  - recognize local `NPC_DEFS` keys for generated route-floor NPCs;
  - audit slime, zhelemish, procedural floor, design-floor route and design-floor generator ids;
  - scan `void` and `design_floors` content modules for unimported content.
- Fixed Living zone id collisions:
  - `src/gen/living/fake_medpost_zhelemish.ts`: zone 46 -> 59.
  - `src/gen/living/white_compulsion_room.ts`: zone 46 -> 60.
  - `src/gen/living/carnivorous_fungus_room.ts`: zone 33 -> 61.

## Commands

- `npm run typecheck`: failed, missing npm script.
- `npm run test:unit`: failed, missing npm script.
- `npm run smoke`: failed, missing npm script.
- `npm run check`: failed, missing npm script.
- `node scripts/content-audit.mjs`: passed after AG120 fixes; `Errors: none`.
- `npm run build`: final rerun failed in `src/systems/procedural_anomalies.ts` due duplicate exported `tryUseProceduralFloorAnomaly`.
- `npx tsc -p tsconfig.json --noEmit`: failed. First blockers include `src/gen/maintenance/pneumomail_station.ts:45` wrong `spawnPlotNpc` arity, unresolved `target`/`transitionTags`/`anomalyData` in `src/main.ts`, duplicate `tryUseProceduralFloorAnomaly` in `src/systems/procedural_anomalies.ts`, and missing `MonsterKind.KRYSNOZHKA` balancing entry in `src/systems/rpg.ts`.
- `npx tsc -p tsconfig.test.json --outDir .test-build`: failed on the same source errors plus `tests/helpers.ts` missing required `uvBeamFx`.
- `node scripts/smoke-playability.mjs`: failed on inventory panel brightness delta threshold before final build blockers were found.

## Blockers

- `package.json` exposes only `dev`, `build`, and `preview`; README-required `typecheck`, `test:unit`, `smoke`, and `check` scripts are absent.
- `src/systems/procedural_anomalies.ts` has duplicate exported runtime helpers and blocks Vite build.
- `src/main.ts` has unresolved symbols in floor/procedural anomaly transition paths.
- `src/gen/maintenance/pneumomail_station.ts` calls a helper with the wrong arity.
- `src/systems/rpg.ts` does not cover the current `MonsterKind` enum.
- `tests/helpers.ts` no longer satisfies `GameState`.

## README Drift

AG119 did not run: no `Status_AG119_*` file and no `LOG_AG119_*` file are present.

README mismatches found:

- `README.md` lists npm commands that are not in `package.json`.
- `README.md` still states `src/data/items.ts` defines 194 item ids; content audit reports 240.
- `README.md` states 208 static rumors; content audit reports 297.
- `README.md` states 20 monster variants; content audit reports 23.
- `README.md` states 199 plot NPC ids and 240 side quest steps; content audit reports 200 and 246.

## Final State

Registry/content audit is green. Build, strict TypeScript, test compilation and smoke remain blocked by larger shared-system conflicts outside AG120 small-fix scope.
