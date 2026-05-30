# Design Floor: `underhell`

Route: z=-38, base `HELL`, role "combat threshold of meat lower".

Primary source:

- `src/gen/design_floors/underhell.ts`
- `Docs/DesignFloors/underhell.md`
- `Docs/DesignFloors/rework_floor_17_underhell.md`

Safe improvement target:

- Combat threshold, tribute gates and liquidator/cult/meat fronts.
- Evolutionary threshold chain scored for entry, threat, fallback, reward and exit.
- Capillary root tunnels and tribute/shelter SDF.

Implementation notes:

- Rare human groups only.
- Ritual gates cannot softlock.
- Keep compact flags/events.

Required decisions:

- Pay/refuse tribute.
- Free or silence witness.
- Burn debt.
- Open void cut.
- Retreat.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
