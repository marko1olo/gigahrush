# Design Floor: `slime_nii`

Route: z=+12, base `KVARTIRY`, role "biolabs, quarantine, slime chambers".

Primary source:

- `src/gen/design_floors/slime_nii.ts`
- `Docs/DesignFloors/rework_floor_20_slime_nii.md`

Safe improvement target:

- Containment cameras, wet cells, dry clean corridors and lab decisions.
- Gray-Scott slime bands on proxy grid.
- Voronoi sealed chambers and drainage wet cells.

Implementation notes:

- No per-frame slime growth.
- Use existing slime hooks, room tags, loot and monster profiles.
- If quarantine/infection combines with anomalies, route remains reachable.

Required decisions:

- Inoculate.
- Harvest sample.
- Burn slime bridge.
- Free or abandon volunteers.
- Expose lab.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
