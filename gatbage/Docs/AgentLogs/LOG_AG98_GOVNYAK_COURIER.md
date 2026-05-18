# LOG AG98 Govnyak Courier Contract

Date: 2026-05-18

## Final Report

- Added `govnyak_courier_package` as a non-spawning, single-stack sealed package item.
- Added three hidden route contract definitions: original delivery, liquidator/Ministry confiscation, and cult switch.
- Added a debug path, `ГОВНЯК: курьерский пакет`, that grants exactly one sealed package and creates all three mutually exclusive routes with normal procedural deadlines.
- Added route completion handling: endpoint routes require the package, target floor, and target room type; resolving one route removes the package, rewards that faction path, applies the configured consequence, and closes the other routes as failed.
- Added opened-package handling through inventory use: breaking the seal removes the package, fails active courier routes, and publishes `player_use_item` plus `contract_failed` facts with `govnyak_courier` / `opened_package` tags.
- Filtered hidden courier route definitions out of generic system-contract assignment so the package cannot be farmed by normal contract generation.
- Removed a duplicate stale `govnyak_roll` item row that conflicted with the richer AG96 definition and prevented the item registry from typechecking.

## Validation

- Baseline `npm run typecheck`: blocked, package has no `typecheck` script.
- Focused touched-file typecheck filter: no AG98 file errors.
- `node scripts/content-audit.mjs`: passed, errors none.
- `npm run build`: passed.
- `npx tsc --noEmit --pretty false`: blocked by existing non-AG98 errors in `src/gen/maintenance/pneumomail_station.ts` and `src/systems/govnyak.ts`.
- `npm run check`, `npm run test:unit`, `npm run smoke`: blocked, scripts are missing from the active `package.json`.
