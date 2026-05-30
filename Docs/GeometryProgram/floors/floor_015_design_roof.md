# Design Floor: `roof`

Route: z=+50, base `MINISTRY`, role "air, antennas, visibility".

Primary source:

- `src/data/design_floors.ts`
- `src/gen/design_floors/roof.ts`
- `Docs/DesignFloors/roof.md`
- `Docs/DesignFloors/rework_floor_01_roof.md`

Safe improvement target:

- Roof archipelago: sheds, exposed slabs, bridge strips and shelter pockets.
- Add LOS heatmap scoring for exposed crossings.
- Add shelter every 24-48 long-sight cells unless the exposure is deliberate.

Implementation notes:

- No ordinary NPC field unless explicitly authored.
- Sky/wind visuals stay render-generic; gameplay facts stay in generation/systems.
- Preserve 8 down lifts and reachable adjacent cells.

Required decisions:

- Cross exposed slab.
- Use hatch/service shed route.
- Repair or steal signal gear.
- Hide from long sight/sky pressure.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
