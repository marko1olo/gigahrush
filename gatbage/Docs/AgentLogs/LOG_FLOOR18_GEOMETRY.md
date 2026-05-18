# LOG FLOOR18_GEOMETRY

## 2026-05-18

Implemented Hell geometry ownership for `FloorLevel.HELL` at z=28.

- Added `src/gen/hell/geometry.ts` with five arena chains, flee loops, ritual rooms, vent throats, bone bridge, cult barricade and repeated safe scars.
- Updated `src/gen/hell/index.ts` so Hell builds that topology, keeps motif textures after connectivity repair, and rechecks connectivity after lift placement.
- Changed Hell ambient pressure from huge global refill caps to bounded spawn pockets and finite reinforcement budgets.
- Preserved manifest-owned Hell content; no core enum, renderer, route, plot-chain or shared-system rewrite.

Validation:

- `npm run check` is blocked by pre-existing unused declarations in `src/gen/design_floors/full_floor.ts`.
- `npm run test:unit` passed 65 tests.
- `npm run build` passed.
- Hell-specific generation probe passed with all 12 lifts reachable from spawn adjacency.
