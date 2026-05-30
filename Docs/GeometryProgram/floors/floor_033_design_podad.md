# Design Floor: `podad`

Route: z=-40, base `HELL`, role "living tunnels, moving walls, lower gate".

Primary source:

- `src/gen/design_floors/podad.ts`
- `Docs/DesignFloors/podad.md`
- `Docs/DesignFloors/rework_floor_18_podad.md`

Safe improvement target:

- Capillary meat field as static route descriptor.
- Section-shift graph and moving-wall chokepoint scoring.
- Monster anchors aligned with existing Herald/living tunnel systems.

Implementation notes:

- Use existing topology systems.
- No ordinary NPC field.
- Do not double-spawn broad monsters.
- Preserve Herald/lower-route gate semantics.

Required decisions:

- Fight Heralds.
- Time walls.
- Bait monsters.
- Use living tunnels.
- Retreat/open lower route.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
