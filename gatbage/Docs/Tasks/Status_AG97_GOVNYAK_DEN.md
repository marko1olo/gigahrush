# AG97 Govnyak Smoke Den Status

Prompt: `AGENT_97_GOVNYAK_SMOKE_DEN`

Preflight:
- XML block extracted from `Docs/AgentPrompts/AGENT_97_GOVNYAK_SMOKE_DEN.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` section 16.4.
- Read required hooks: `src/gen/living/zone_content.ts`, `src/gen/kvartiry/content_manifest.ts`, `src/systems/containers.ts`, `src/systems/economy.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: blocked. `package.json` currently exposes only `dev`, `build`, and `preview`; npm reports `Missing script: "typecheck"`.

Plan:
- [x] Add one Living POI content module for the cramped smoke den.
- [x] Register finite dealer/debt/report/protection choices via local side quests.
- [x] Add controlled den containers so theft uses existing witness/audit events.
- [x] Bridge den-specific quest/theft outcomes into world events and rumors.
- [x] Import the module from the Living content manifest.
- [x] Validate with available commands.

Implementation:
- Added `src/gen/living/govnyak_smoke_den.ts`.
- Added Living manifest import in `src/gen/living/content_manifest.ts`.
- Added den-specific rumor ids in `src/data/rumors.ts`.
- Uses existing `govnyak_roll` stock/rewards from the AG96 item work; no forced use path was added.

Validation:
- `npm run typecheck`: blocked, script missing from `package.json`.
- `npx tsc --noEmit`: failed on existing/current-worktree unrelated project errors; no AG97 file errors were reported.
- `npm run build`: final rerun blocked by unrelated current-worktree error: `src/main.ts` imports `tryUseProceduralFloorAnomaly`, which is not exported by `src/systems/procedural_anomalies.ts`.
- `npm run check`: blocked, script missing from `package.json`.
- `npm run smoke`: blocked, script missing from `package.json`.
