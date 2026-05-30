# Design Floor: `floor_69`

Route: z=-4, base `MAINTENANCE`, role "inhabited anomaly, deals, rumors".

Primary source:

- `src/gen/design_floors/floor_69.ts`
- current route data in `src/data/design_floors.ts`

Safe improvement target:

- Public/backstage/debt/refuge loops with raid shutters.
- Ownership and visibility heatmaps.
- Raid-shutter min-cuts that do not softlock.

Implementation notes:

- Keep non-graphic adult boundary.
- No minors.
- Respect portal-strict disabling rules where applicable.
- Population profile capped; no bespoke crowd refill.

Required decisions:

- Protect or profit from blackmail.
- Handle raid roster.
- Use clinic/refuge.
- Clear or forge debt.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- Check strict portal mode if touched.
