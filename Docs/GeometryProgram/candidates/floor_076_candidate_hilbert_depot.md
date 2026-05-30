# Candidate Floor: `hilbert_depot`

Recommended form: authored design floor or procedural geometry profile.

Base floor: `FloorLevel.MAINTENANCE`.

Fantasy: storage floor where Hilbert index matters more than eye distance.

Algorithm stack:

- Hilbert/Peano curve
- safe primary aisle
- locked chords
- curve-index cargo/loot order

Gameplay decisions:

- follow safe curve
- cut chord
- steal indexed cargo
- reorder segment labels

Implementation caution:

- do not save giant curve state
- route cues must teach index order
