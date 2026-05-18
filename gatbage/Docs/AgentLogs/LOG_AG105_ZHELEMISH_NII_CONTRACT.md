# LOG AG105 Zhelemish NII Contract

Implemented AG105 as a contract-driven zhelemish sample route.

Changes:

- Added `zhelemish_sample_sealed` and `zhelemish_sample_contaminated` as contract-only sample item ids.
- Added `nii_zhelemish_pure_sample`, a scientist/NII FETCH contract with zhelemish scarcity reward scaling, deadline support through existing procedural quest deadlines, and tags ordered for event visibility.
- Added dynamic target preparation in `systems/contracts.ts`: the contract chooses a mushroom-mycelium procedural floor from the current run, or falls back to the existing LIVING mushroom cellar if no procedural target exists.
- Added a bounded floor hook that spawns one sealed sample at the selected target and contaminated wrong-route samples on other mushroom-mycelium procedural floors while the contract is active.
- Added zhelemish contract failure handling for contaminated samples; sealed samples complete through the existing FETCH completion path.
- Added generic active-FETCH item-drop map diamonds in `render/map_ui.ts`.
- Added a zhelemish NII rumor/lead.

Validation:

- Baseline `npm run typecheck`: failed because no `typecheck` script exists in `package.json`.
- `npx tsc -p tsconfig.json --noEmit`: passed.
- `npm run build`: passed.
- `npm run check`: failed because no `check` script exists in `package.json`.

