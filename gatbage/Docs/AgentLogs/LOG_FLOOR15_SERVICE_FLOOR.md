# FLOOR15_SERVICE_FLOOR Log

## 2026-05-18

Implemented the Service Floor as an owned design-floor module at `src/gen/design_floors/service_floor.ts`.

Summary:

- Added a deterministic service/backstage floor generator with lift machines, staff corridors, breaker room, janitor depot, ventilation junction, staff canteen and raid dispatcher office.
- Registered four local quest NPCs: Борис Лифтёр, Надя Ключница, Рома Щитовой and Павел Без Пропуска.
- Registered side quests for lift repair, scoped master-key access, raid reroute and light restoration.
- Added local route/access/power flags and event helpers so a repair can change `liftMachineState`, `lowerStaffRouteOpen` and `productionBypassArmed` without changing central lift travel.
- Kept master-key behavior scoped to recorded Service Floor door/container ids. No generic universal key behavior was added.

Validation:

- `npm run build` passed before implementation.
- Final `npm run build` passed after implementation.
- Initial `npm run typecheck` passed after the Service Floor implementation.
- Targeted compile for `src/gen/design_floors/service_floor.ts` passed.
- A later full-tree `npm run typecheck` rerun is blocked by unowned `src/gen/design_floors/chthonic_attic.ts:273` (`evidenceDoor` unused).

Integrator notes:

- Future route integration should consume `generateServiceFloorDesignFloor()` and `ServiceFloorState`.
- The module intentionally uses `FloorLevel.MAINTENANCE` for enum-bound container/event compatibility until authored design floors get string-id route integration.
- `summarizeServiceFloorFlags()` is ready for debug menu output.
