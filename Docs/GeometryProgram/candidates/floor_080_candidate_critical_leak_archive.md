# Candidate Floor: `critical_leak_archive`

Status: implemented 2026-05-30 as routed authored design floor `critical_leak_archive` at `z=+24`.

Recommended form: authored design floor or procedural geometry profile.

Base floor: `FloorLevel.MINISTRY`.

Fantasy: archive at percolation threshold where one wet cluster barely connects documents.

Algorithm stack:

- critical site/bond percolation
- largest component extraction
- skeletonized causeways
- bridge insertion

Gameplay decisions:

- carry dry documents
- take contaminated shortcut
- raise floodgate
- trade dry archive packets

Implementation caution:

- largest component includes spawn/lifts or bridges added
- no full-world candidate loops

Shipped implementation:

- Route data: `src/data/design_floors.ts`.
- Generator: `src/gen/design_floors/critical_leak_archive.ts`.
- Manifest registration: `src/gen/design_floors/manifest.ts`.
- Population profile: `src/data/design_floor_population.ts`.
- Tests: `tests/critical-leak-archive.test.ts`, plus the route-neighbor assertion in `tests/bank-floor.test.ts`.
