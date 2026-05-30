# Candidate Floor: `turing_nursery`

Recommended form: authored design floor or `slime_nii` expansion.

Base floor: `FloorLevel.KVARTIRY` or `FloorLevel.MAINTENANCE`.

Fantasy: slime/science floor where reaction-diffusion patterns form rooms and contamination.

Algorithm stack:

- Gray-Scott reaction diffusion
- threshold bands
- skeletonized walkable lanes
- MST/repair between anchors

Gameplay decisions:

- inoculate basin
- harvest sample
- burn slime bridge
- expose lab growth

Implementation caution:

- avoid duplicating `slime_nii` without a new decision
- growth generation-time unless bounded anomaly owns it
