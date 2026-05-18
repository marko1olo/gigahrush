# Status AG105 Zhelemish NII Contract

Prompt: `AGENT_105_ZHELEMISH_NII_CONTRACT`

## Preflight

- [x] Extracted prompt block by id.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.1 and 16.5.
- [x] Read `src/data/contracts.ts`.
- [x] Read `src/systems/contracts.ts`.
- [x] Read `src/data/procedural_floors.ts`.
- [x] Read `src/systems/procedural_floors.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Baseline `npm run typecheck`: failed because `package.json` has no `typecheck` script.

## Implementation

- [x] Add sealed/contaminated zhelemish sample item ids.
- [x] Add NII pure zhelemish sample contract template.
- [x] Select a procedural mushroom target with LIVING cellar fallback.
- [x] Spawn sealed target sample and contaminated wrong-route sample through a bounded contract hook.
- [x] Publish accepted/collected/contaminated/delivered/failed events through existing event types and tags.
- [x] Add map marker support for active FETCH item drops.
- [x] Run validation.

## Validation

- `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.
- `npx tsc -p tsconfig.json --noEmit`: passed.
- `npm run build`: passed.
- `npm run check`: failed because `package.json` has no `check` script.
