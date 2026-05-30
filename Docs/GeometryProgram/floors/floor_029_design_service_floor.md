# Design Floor: `service_floor`

Route: z=-18, base `MAINTENANCE`, role "service bypass and repair".

Primary source:

- `src/gen/design_floors/service_floor.ts`
- `Docs/DesignFloors/service_floor.md`
- `Docs/DesignFloors/rework_floor_14_service_floor.md`

Safe improvement target:

- Machine maze, staff routes, ducts and cable trenches.
- Utility graph with power/water/lift fronts.
- Tensor ducts/cables and drainage pressure basins.

Implementation notes:

- No `main.ts` lift hacks.
- Panel effects must be bounded and dirty-flagged.
- Route-critical lift access remains generic.

Required decisions:

- Repair lift.
- Reroute access.
- Steal keys.
- Use ducts.
- Restore power.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
