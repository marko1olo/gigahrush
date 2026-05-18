# Status AG41 Production POI

Prompt: `AGENT_41_PRODUCTION_CONFLICT_POI`

## Preflight

- Extracted prompt block by id.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` P0.5/P2.
- Read required production/container/factory/manifest/helper files.
- Baseline build: passed (`npm run build`).

## Implementation

- Floor: `MAINTENANCE`.
- Conflict: tech/ammo output from a charged-cell dispatcher container.
- New POI module: `src/gen/maintenance/charge_cage.ts`.
- Manifest entry: added to `src/gen/maintenance/content_manifest.ts`.
- Contract/rumor hook: `maint_charge_cell_089`, `maint_charge_cage_089`.

## Polish Check

- Named room: `Диспетчерская зарядки: ящик 089`.
- Reachable output container: `Выходной шкаф ячеек 089`, owned by Назар and tagged for `utility_room` production output.
- Player decision: earn an energy cell via Назар's robot kill quest, earn one via Ада's circuit-board fetch quest, steal from the owner locker, or fight through the nearby robot/EYE pressure.
- Reachability path: contract `maint_charge_cell_089` and rumor `maint_charge_cage_089`.
- Runtime path: existing slow production ticks write `utility_room` output into the locker and publish the normal production/container events.

## Validation

- `npm run build`: passed before implementation.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed after waiting for another workspace validation run to stop using shared `.test-build`.
- `npm run build`: passed.
- `npm run smoke`: passed.
- `npm run check`: passed on retry after an earlier shared `.test-build` cancellation.
