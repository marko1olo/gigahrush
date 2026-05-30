# Design Floor: `chthonic_attic`

Route: z=+46, base `MINISTRY`, role "service attic, caches, old shafts".

Primary source:

- `src/gen/design_floors/chthonic_attic.ts`
- `Docs/DesignFloors/chthonic_attic.md`
- `Docs/DesignFloors/rework_floor_02_chthonic_attic.md`

Safe improvement target:

- Crawl graph plus shrine/storage niches.
- Static capillary/DLA roots, wires or cracks.
- Low-ceiling SDF shell cues.

Implementation notes:

- Preserve one wide combat path and one stealth crawl path.
- Roots/cracks must not delete lift access or route-critical rooms.
- Geometry is generation-time only unless using existing bounded systems.

Required decisions:

- Cut/feed root.
- Burn/use shrine.
- Steal relic/cache.
- Escort through crawlspace.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
