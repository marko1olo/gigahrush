# Candidate Floor: `shahta_atrium`

Priority: required first-wave candidate.

Recommended form: authored design floor.

Base floor: `FloorLevel.MINISTRY` or `FloorLevel.MAINTENANCE`.

Fantasy: internal vertical void expressed in 2D through bridges, abyss lanes, lift ribs and exposed crossings.

Algorithm stack:

- concentric ring graph
- sparse bridge graph
- abyss/cover fields
- LOS scoring
- lift-spoke graph

Implementation files:

- `src/gen/design_floors/shahta_atrium.ts`
- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`

Required structures:

- central void/abyss field
- ring walkway
- at least 4 bridges
- service rim bypass
- repairable bridge/chord
- cover islands

Gameplay decisions:

- cross exposed bridge
- take service rim
- repair bridge
- lure monsters into open lane
- choose quick crossing or safe spiral

Validation:

- at least two distinct spawn-exit paths
- void cannot swallow route anchors
- bridge repair optional
- LOS/cover score recorded
