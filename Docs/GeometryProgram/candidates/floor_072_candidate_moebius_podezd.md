# Candidate Floor: `moebius_podezd`

Priority: required first-wave candidate.

Recommended form: authored design floor first; procedural anomaly later only if readable.

Base floor: `FloorLevel.KVARTIRY` or `FloorLevel.LIVING`.

Fantasy: residential non-orientable loop where the same entrance becomes wrong after an orientation flip.

Algorithm stack:

- strip graph with parity/orientation flips
- paired seam gates
- mirrored room labels
- reversed patrol routes

Implementation files:

- `src/gen/design_floors/moebius_podezd.ts`
- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`

Required structures:

- two residential strips
- paired seam landmarks
- mirrored flats
- safe public loop
- risky parity shortcut

Gameplay decisions:

- choose corridor after orientation flip
- break seam lock
- use mirror tells
- exploit reversed patrol
- recover lost route marker

Validation:

- baseline route works without teleport trick
- parity shortcut optional
- mirror cues visible
- no seam gate isolates major route area
