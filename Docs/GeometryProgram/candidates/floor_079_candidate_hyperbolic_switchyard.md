# Candidate Floor: `hyperbolic_switchyard`

Implementation status: added as an authored design floor route `hyperbolic_switchyard` at z=-20.

Primary source:

- `src/gen/design_floors/hyperbolic_switchyard.ts`
- `tests/hyperbolic-switchyard.test.ts`

Recommended form: authored design floor.

Base floor: `FloorLevel.MAINTENANCE`.

Fantasy: transit/service floor where signs and adjacency feel hyperbolic.

Algorithm stack:

- Poincare-like arc graph
- geodesic service corridors
- horocycle platforms
- switchable arc families

Gameplay decisions:

- pay guide
- flip switch family
- take monster-heavy geodesic shortcut
- sabotage false platform

Implementation caution:

- actual coordinates remain ordinary toroidal `World`
- readability is the main risk
