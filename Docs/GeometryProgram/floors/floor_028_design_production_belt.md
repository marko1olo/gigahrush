# Design Floor: `production_belt`

Route: z=-14, base `MAINTENANCE`, role "loot, repair, production".

Primary source:

- `src/gen/design_floors/production_belt.ts`
- `Docs/DesignFloors/production_belt.md`
- `Docs/DesignFloors/rework_floor_13_production_belt.md`

Safe improvement target:

- Factory lines, dock loops, side rooms and catwalk bypasses.
- Tensor conveyor spines as static route lines.
- Hazard/shelter SDF around machines.

Implementation notes:

- No live conveyor physics unless existing bounded anomaly/system owns it.
- Use factory ids, containers, cooldowns and events.
- Machine hazards must have visible approach cues.

Required decisions:

- Repair.
- Sabotage.
- Work shift.
- Steal output.
- Reroute supply.
- Escort worker.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
