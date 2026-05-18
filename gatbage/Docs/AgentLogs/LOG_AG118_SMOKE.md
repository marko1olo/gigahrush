# AG118 Slime/Cult Smoke Log

2026-05-18

- Added third-wave source detection and optional browser scenario to `scripts/smoke-playability.mjs`.
- Scenario is enabled by `SMOKE_SCENARIO=third-wave`, `SMOKE_SCENARIO=slime-cult`, or `SMOKE_THIRD_WAVE=1`.
- Source audit reports covered slices and explicit skips before Chrome starts.
- Runtime path uses existing debug commands only: Maintenance teleport, faction event force, Veretar force, Living recovery teleport.
- `node --check scripts/smoke-playability.mjs`: passed.
- `npm run build`: passed.
- Baseline and final `npm run smoke`: blocked by missing npm script.
- `SMOKE_SCENARIO=third-wave node scripts/smoke-playability.mjs`: failed on existing runtime exception `ReferenceError: updateActiveFactionClashes is not defined`.
- `npm run test:unit`, `npm run typecheck`, `npm run check`: blocked by missing npm scripts.
- `npx tsc --noEmit`: failed on existing workspace TypeScript errors, including missing faction clash helpers.
- `node scripts/content-audit.mjs`: failed on existing content registry issues listed in `Docs/Tasks/Status_AG118_SMOKE.md`.

No gameplay content was implemented for AG118.
