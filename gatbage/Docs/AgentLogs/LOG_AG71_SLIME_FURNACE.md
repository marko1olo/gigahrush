# AG71 Slime Deactivation Furnace Log

## 2026-05-18

- Added a Maintenance deactivation furnace POI with quarantine intake, noisy furnace room, sealed fuel cage, liquidator operator, black-market claimant, local stained/fogged residue, locked/faction fuel conflict, and nearby startup threats.
- Connected the furnace to existing slime rails by consuming `slime_sample_brown` from a production container rather than importing the NII sample-post module.
- Added `deactivated_residue` as the visible safe cleanup output.
- Added `slime_deactivation_furnace` factory recipe: `slime_sample_brown` item + `fuel` + `tools` + `labor` -> `deactivated_residue` + `gasmask_filter`.
- Extended production recipes with optional `inputItems` and `eventTags`; output/shortage events now carry AG71 tags, including `furnace_used`, `deactivation_completed`, and `fuel_missing` when fuel is the missing input.
- Added tests for factory input item references and the furnace sample-consumption path.

Validation:

- Baseline `npm run typecheck`: failed before edits because the script is missing from `package.json`.
- `npm run check`: failed because the script is missing from `package.json`.
- `npx tsc --noEmit`: blocked by unrelated existing worktree errors outside AG71.
- `npm run build`: blocked by unrelated `src/gen/procedural_floor.ts` duplicate `roomCenter`.
- `git diff --check` on AG71-touched files: passed.
