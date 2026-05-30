# Candidate Floor: `harmonic_bathhouse`

Recommended form: authored design floor.

Base floor: `FloorLevel.MAINTENANCE` or `FloorLevel.LIVING`.

Fantasy: bathhouse/boiler floor governed by heat, steam and pressure gradients.

Algorithm stack:

- scalar potential field
- relaxation solve
- level-set corridors
- steam/fog/water bands

Gameplay decisions:

- turn valve
- take hot fast path
- take cold flooded bypass
- repair pressure route

Implementation caution:

- valve runtime changes local only
- dirty flags for fog/features/cells
