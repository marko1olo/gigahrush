# LOG AG41 Production POI

## Summary

Implemented Maintenance production-conflict POI `Диспетчерская зарядки: ящик 089`.

The POI uses the existing `utility_room` factory route. Its production output lands in `Выходной шкаф ячеек 089`, an owned Liquidator locker with `production_output`, `utility`, and `room` tags. The player can resolve the energy-cell conflict by completing Назар's robot audit quest, helping Ада with circuit boards, stealing from the locker, or fighting through nearby ROBOT/EYE pressure.

## Files

- `src/gen/maintenance/charge_cage.ts`: new room, owned output container, NPCs, side quests, drops, monsters.
- `src/gen/maintenance/content_manifest.ts`: Maintenance manifest entry.
- `src/data/contracts.ts`: contract `maint_charge_cell_089`.
- `src/data/rumors.ts`: rumor `maint_charge_cage_089`.
- `README.md`: factual Maintenance content update.
- `Docs/Tasks/Status_AG41_PRODUCTION_POI.md`: preflight, implementation, polish, validation status.

## Verification

- Named room: `Диспетчерская зарядки: ящик 089`.
- Reachable container: `Выходной шкаф ячеек 089`.
- Production path: room name and type match `utility_room`; locker tags match factory output tags, so existing slow production ticks fill the same reachable container.
- Event/reachability path: existing production events fire from `tickProduction`; contract and rumor point the player to the POI.

## Validation

- Baseline `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed after waiting for concurrent shared `.test-build` usage to clear.
- `npm run build`: passed.
- `npm run smoke`: passed.
- `npm run check`: passed on retry after an earlier shared `.test-build` cancellation.
