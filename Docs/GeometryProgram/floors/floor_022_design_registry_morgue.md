# Design Floor: `registry_morgue`

Route: z=+18, base `MINISTRY`, role "dead records and verification".

Primary source:

- `src/gen/design_floors/registry_morgue.ts`
- `Docs/DesignFloors/registry_morgue.md`
- `Docs/DesignFloors/rework_floor_08_registry_morgue.md`

Safe improvement target:

- Drawer canyon, tag switchbacks, cold vaults and autopsy/record bays.
- Hilbert tag order for drawer/record sequence.
- Potts domains: living record, dead record, contaminated record.

Implementation notes:

- Systemic horror, not gore.
- Medical loot stays owned, locked or consequence-bearing.
- Cold shells must not block both lift directions.

Required decisions:

- Identify body.
- Forge tag.
- Steal medicine.
- Expose swap.
- Escort relative.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
