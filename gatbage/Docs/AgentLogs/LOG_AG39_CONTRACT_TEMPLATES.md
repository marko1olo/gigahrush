# LOG AG39 Contract Expedition Templates

Date: 2026-05-17

## Final Report

- Added 18 expedition contracts across all six story floors, covering FETCH, KILL, TALK and VISIT semantics.
- Added contract fields for `targetPlotNpcId`, `targetNpcName` and `extraRewards`; `contractToQuest` now carries TALK targets, extra rewards and VISIT floor completion through generic quest state.
- Kept expedition routing data-driven through existing contract `target` metadata: floor, room type, zone tag and player hint.
- Scarcity-adjusted contract money now uses the contract target floor for target-floor resource pressure.
- Contract events now include contract tags, target item/monster/NPC data, reward resource id and route metadata on create/complete/fail.
- Updated content audits to validate contract target floors, room types, plot NPC targets, extra rewards and reward resources.
- Added status/debug paths in `Docs/Tasks/Status_AG39_CONTRACT_TEMPLATES.md`.

## Validation

- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after implementation.
- Isolated unit suite using `.test-build-ag39`: passed.
- `npm run build`: passed after implementation.
- `npm run check`: attempted, but concurrent processes were repeatedly deleting/reusing `.test-build`, causing the package test runner to lose emitted test files.
- `npm run smoke`: failed with blank WebGL canvas samples after gameplay start. No contract-specific console error was reported; title/HUD paint reached the smoke script. This remains a render/smoke blocker outside AG39 contract data.

