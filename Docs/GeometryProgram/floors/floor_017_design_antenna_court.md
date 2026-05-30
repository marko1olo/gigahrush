# Design Floor: `antenna_court`

Route: z=+42, base `MINISTRY`, role "signal, outer wind, observation".

Primary source:

- `src/gen/design_floors/antenna_court.ts`
- `Docs/DesignFloors/antenna_court.md`
- `Docs/DesignFloors/rework_floor_03_antenna_court.md`

Safe improvement target:

- Signal yard with repeater sectors and cable bypasses.
- Weighted Voronoi antenna cells.
- Tensor cable spines and Hough/Radon signal corridors.

Implementation notes:

- Scientist/liquidator pockets only; no broad social sim.
- Signal results should publish compact events if other systems need them.
- No runtime scanline math over the world.

Required decisions:

- Calibrate.
- Jam.
- Record/expose signal.
- Protect or betray signal enclave.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
