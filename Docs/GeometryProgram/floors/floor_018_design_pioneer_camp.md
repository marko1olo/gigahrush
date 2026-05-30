# Design Floor: `pioneer_camp`

Route: z=+38, base `LIVING`, role "social camp, supplies, high-route civil pocket".

Primary source:

- `src/gen/design_floors/pioneer_camp.ts`
- `Docs/DesignFloors/pioneer_camp.md`
- `Docs/DesignFloors/rework_floor_04_pioneer_camp.md`

Safe improvement target:

- Camp loop grammar: square, canteen, medpost, loudspeaker, storage and old cabin.
- Poisson concrete forest/trail points.
- BFS safe-trail shells.

Implementation notes:

- No schedule sim.
- Use route rooms and shared population placement.
- Keep content non-exploitative and gameplay-safe.

Required decisions:

- Verify roster.
- Repair loudspeaker.
- Choose medpost/canteen outcome.
- Risk old cabin edge.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
