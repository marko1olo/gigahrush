# Candidate Floor: `spectral_chasovnya`

Recommended form: authored design floor.

Base floor: `FloorLevel.HELL`, `FloorLevel.MINISTRY` or `FloorLevel.VOID`.

Fantasy: sound, cult and hearing geometry.

Algorithm stack:

- graph Laplacian/eigenmode bands
- standing-wave rooms
- acoustic shadow zones
- bell/radio nodes

Gameplay decisions:

- fire loudly to reveal/move threats
- move silently through nodes
- ring bell
- avoid sound-focusing monsters

Implementation caution:

- runtime sound pulses are local event effects
- no full-world acoustic solver
