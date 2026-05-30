# Majority Profile: `scientists`

Type: existing `FloorMajorityId`.

Goal: make scientist-majority floors spatially experimental, clean/dirty and observation-heavy.

Spatial imprint:

- lab cells
- observation rooms
- clean/dirty borders
- sample corridors

Implementation notes:

- Voronoi/quarantine cells fit this majority.
- Sealed optional rooms are allowed, route backbone is not.
- Samples and medical cabinets need ownership/risk cues.

Decisions:

- Harvest sample.
- Expose lab.
- Steal medicine.
- Escort scientist.

Validation:

- Sealed optional rooms do not block lift access.
