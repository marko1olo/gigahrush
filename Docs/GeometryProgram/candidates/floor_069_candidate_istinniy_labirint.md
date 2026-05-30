# Candidate Floor: `istinniy_labirint`

Priority: required first-wave candidate.

Recommended form: authored design floor.

Base floor: `FloorLevel.MINISTRY`.

Fantasy: true wayfinding horror where navigation, retreat memory and supplies are the main threat.

Algorithm stack:

- Wilson or Growing Tree maze on coarse toroidal grid.
- Braiding post-pass.
- Landmark rooms by depth, betweenness and dead-end value.
- Ariadne-thread cues: chalk, wire, footprints or lamp residue.

Implementation files:

- `src/gen/design_floors/istinniy_labirint.ts`
- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`
- focused tests

Required structures:

- connected maze backbone
- at least 6 landmarks
- optional locked chords
- reward dead ends
- lift backbone ungated

Gameplay decisions:

- mark route with consumable/tool
- follow safe wall route
- cut through monster-heavy chord
- rescue or abandon lost NPC
- recover document stash

Validation:

- forced route generation
- spawn to both lift directions reachable
- locked edges optional only
- path entropy and landmark spacing measured
