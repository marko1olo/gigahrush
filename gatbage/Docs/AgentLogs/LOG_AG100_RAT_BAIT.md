## 2026-05-18 - AG100 Rat Bait Behavior

What changed:
- Added `src/systems/monster_bait.ts`, a fixed-cap temporary bait marker registry for dropped food and used/dropped govnyak.
- Wired inventory drop/use hooks so bait placement publishes events and item pickup removes stale bait markers.
- Wired monster AI so `KRYSNOZHKA`, `SBORKA`, `TVAR` and `POLZUN` can follow bait unless combat is already inside 5 cells. Consumed dropped bait removes the item drop.
- Added world event types for bait placed, attracted, consumed and expired.
- Added focused tests in `tests/monster-bait.test.ts` and documented shipped behavior in `README.md`.

Performance:
- No item-drop scans and no per-frame world scans.
- Active bait markers are capped at 8 and each monster checks at most 8 markers on a cooldown.
- Expiry runs once through the tiny marker list from the AI orchestrator.

Validation:
- Baseline `npm run typecheck`: blocked because the script is absent from `package.json`.
- `npx tsc --noEmit`: passed.
- `npx tsc -p tsconfig.test.json`: passed after refreshing `tests/helpers.ts` for existing UV beam state.
- `node --test .test-build/tests/monster-bait.test.js`: passed, 3 tests.
- `npm run check`: blocked because the script is absent from `package.json`.
- `npm run build`: passed.
- `git diff --check`: passed.
