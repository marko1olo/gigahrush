# Design Floor: `darkness`

Route: z=-48, base `VOID`, role "late pressure and darkness".

Primary source:

- `src/gen/design_floors/darkness.ts`
- `Docs/DesignFloors/darkness.md`
- `Docs/DesignFloors/rework_floor_19_darkness.md`

Safe improvement target:

- Dead lamps, light pockets, listening routes and protocol dark.
- Small light-resource graph.
- BFS reveal shells and sound-path graph.
- Sparse Radon sight corridors.

Implementation notes:

- Keep NPC-free late-route identity.
- Low visibility must remain readable enough for play.
- No hidden instant death.

Required decisions:

- Spend light.
- Listen.
- Flee.
- Follow protocol.
- Abandon loot.
- Preserve name.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- `npm run check:browser` for light/readability changes.
