# Design Floor: `voronoi_quarantine`

Route: z=+6, base `KVARTIRY`, role "quarantine cells, passes and supply ridges".

Primary source:

- `src/gen/design_floors/voronoi_quarantine.ts`
- `Docs/GeometryProgram/candidates/floor_075_candidate_voronoi_quarantine.md`

Implemented geometry:

- Weighted Laguerre/Voronoi site cells for checkpoints, clinic, kitchen, office, wards, supply connector and corpse pits.
- Two Lloyd relaxation passes before cell assignment.
- Voronoi ridge adjacency graph used as the Delaunay-style dual graph.
- Ridge doors across connected cell borders, with official and forged quarantine pass gates.

Implemented decisions:

- Forge a quarantine pass.
- Cross clean/dirty cell borders.
- Escort the infected NPC to the doctor through a TALK quest.
- Open the dry supply connector through decontamination work and gated supply loot.

Implementation notes:

- Site cells are recorded as real rooms and zone tuning maps quarantine pressure from those rooms.
- The ridge graph is connected and covered by focused tests.
- There is no infection refill or runtime population loop; pressure comes from generation, authored actors and the design-floor population field.

Validation:

- Focused: `npx tsx --test tests/voronoi-quarantine.test.ts`
- Broad gates are currently blocked by unrelated dirty-tree typecheck/content-audit errors.
