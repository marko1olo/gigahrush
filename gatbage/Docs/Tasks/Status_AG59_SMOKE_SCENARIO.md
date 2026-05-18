# AG59 Smoke Expedition Scenario

## Prompt

Extracted prompt id: `AGENT_59_SMOKE_EXPEDITION_SCENARIO`.

Scope: expand automated smoke from startup-only confidence to an optional short expedition scenario while keeping the default smoke runtime acceptable.

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` Definition of Done sections.
- Read `package.json`.
- Read `scripts/smoke-playability.mjs`.
- Read `tests/*.ts`.
- Read `src/systems/debug.ts`.
- Read `src/main.ts`.
- Read `src/input.ts`.

## Baseline

- Initial baseline `npm run check` failed during `npm run typecheck`.
- Failure class: TypeScript `TS2741` in `src/data/contracts.ts` where multiple `ContractDef` entries were missing the required `target` field.
- The baseline failure was present before AG59 edits. Later final validation ran after the shared tree had a clean contract dataset.

## Implementation Notes

- Expanded `scripts/smoke-playability.mjs` from startup paint confidence into an input-driven playability path:
  - default smoke starts the title, focuses/clicks the canvas, moves, opens/closes inventory, and checks nonblank HUD plus composited scene pixels;
  - optional expedition smoke is enabled with `SMOKE_EXPEDITION=1`, `SMOKE_LONG=1`, or `SMOKE_SCENARIO=expedition|long`;
  - expedition smoke opens debug, runs the final smoke setup command, shoots, opens the quest panel, uses the lift interaction, and verifies the scene after each major step.
- Added CDP screenshot PNG sampling in the smoke script because direct WebGL canvas readback can be black with the current browser/render path while the composited page screenshot reflects the real rendered scene.
- Added failure diagnostics in the smoke script: key trace, focus/pointer-lock state, and optional `SMOKE_SCREENSHOT_ON_FAIL`.
- Added debug command `Smoke: expedition setup` in `src/systems/debug.ts` to equip a Makarov, add 9mm ammo, move the player to a lift-facing cell, spawn a nearby low-HP target, and create a contract for the quest panel.
- Fixed one runtime blocker caught by smoke in `src/systems/void_protocols.ts` by aliasing the world-event observer import before registration, avoiding the built bundle `ReferenceError`.

## Validation

- `node --check scripts/smoke-playability.mjs`: passed.
- `node scripts/smoke-playability.mjs`: passed; `expedition=off; hudLit=6727, hudCenterLit=125, sceneLit=202145`.
- `SMOKE_EXPEDITION=1 node scripts/smoke-playability.mjs`: passed; `expedition=on; hudLit=6087, hudCenterLit=1449, sceneLit=133126`.
- `SMOKE_EXPEDITION=1 npm run smoke`: passed; `expedition=on; hudLit=6094, hudCenterLit=2719, sceneLit=199707`.
- Final `npm run check`: passed with exit `0`; typecheck, all unit suites, build, and default smoke completed. Final smoke sample: `expedition=off; hudLit=6213, hudCenterLit=1205, sceneLit=201002`.
