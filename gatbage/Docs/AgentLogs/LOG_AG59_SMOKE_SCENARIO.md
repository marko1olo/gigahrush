# LOG_AG59_SMOKE_SCENARIO

## 2026-05-17

- Expanded `scripts/smoke-playability.mjs` so default smoke now starts the game, focuses input, moves, opens/closes inventory, and checks nonblank HUD plus composited scene pixels.
- Added optional expedition smoke via `SMOKE_EXPEDITION=1`, `SMOKE_LONG=1`, or `SMOKE_SCENARIO=expedition|long`; it runs a debug setup, shoots, opens the quest panel after a generated contract, uses a lift interaction, and validates rendering after each major step.
- Added screenshot-based PNG scene sampling, smoke input diagnostics, and optional `SMOKE_SCREENSHOT_ON_FAIL` capture for debuggable failures.
- Added the debug command `Smoke: expedition setup` in `src/systems/debug.ts` to equip a smoke-safe kit, move the player to a lift-facing cell, spawn a nearby target, and create a contract.
- Fixed the `src/systems/void_protocols.ts` observer registration runtime blocker caught by smoke by aliasing the imported `registerWorldEventObserver` before top-level registration.

Validation:

- Baseline `npm run check`: failed before AG59 edits during `typecheck` with `TS2741` contract definitions in `src/data/contracts.ts` missing required `target` fields.
- `node --check scripts/smoke-playability.mjs`: passed.
- Default smoke `node scripts/smoke-playability.mjs`: passed with `expedition=off; hudLit=6727, hudCenterLit=125, sceneLit=202145`.
- Expedition smoke `SMOKE_EXPEDITION=1 node scripts/smoke-playability.mjs`: passed with `expedition=on; hudLit=6087, hudCenterLit=1449, sceneLit=133126`.
- Expedition smoke second run `SMOKE_EXPEDITION=1 npm run smoke`: passed with `expedition=on; hudLit=6094, hudCenterLit=2719, sceneLit=199707`.
- Final `npm run check`: passed with exit `0`; typecheck, unit tests, build, and default smoke all completed. Final default smoke sample: `expedition=off; hudLit=6213, hudCenterLit=1205, sceneLit=201002`.
