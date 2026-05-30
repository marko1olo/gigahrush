# Candidate Floor: `voronoi_quarantine`

Recommended form: authored design floor or procedural geometry profile.

Base floor: `FloorLevel.KVARTIRY` or `FloorLevel.MINISTRY`.

Fantasy: quarantine split into cells around clinics, kitchens, checkpoints and corpse pits.

Algorithm stack:

- weighted Voronoi/Laguerre cells
- Delaunay adjacency graph
- Lloyd relaxation
- border walls and ridge doors

Gameplay decisions:

- forge pass
- cross border
- escort infected NPC
- open supply connector

Implementation caution:

- site cells map to zones
- Delaunay graph connected
- no infection refill
