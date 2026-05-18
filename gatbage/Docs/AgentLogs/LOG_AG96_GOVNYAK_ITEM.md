# AG96 Govnyak Item Loop Log

Date: 2026-05-18

## Summary

- Added four govnyak item definitions: cheap roll, pressed brick, NII sample, and bad batch.
- Added bounded use handling in inventory through `systems/govnyak.ts`: short PSI relief with water/sleep/HP costs, attack delay, cough aim-spread penalty, debt status, bad batch risk, and timed recovery.
- Added contraband availability through trade pools, stash/container pools, black-market floor inventories, and the economy `contraband` resource.
- Added events and rumor hooks for use, trade, confiscation, bad batch, debt application, cough clearing, and debt recovery.
- Updated README item/rumor counts and AG96 task status.

## Validation

- Baseline `npm run typecheck`: failed before edits because the script is not defined in `package.json`.
- `npm run check`: failed because the script is not defined in `package.json`.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `git diff --check` on touched paths: passed.
