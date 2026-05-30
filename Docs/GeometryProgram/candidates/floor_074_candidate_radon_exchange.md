# Candidate Floor: `radon_exchange`

Status: implemented as the authored Ministry route floor at `z=+44`.

Recommended form: authored design floor or procedural geometry profile.

Base floor: `FloorLevel.MINISTRY`.

Fantasy: upper technical transfer floor where corridors are scan lines through concrete.

Algorithm stack:

- Radon/Hough line families
- angle/radius bins
- intersections as controls
- sparse blind wedges

Gameplay decisions:

- rotate scanner shutter
- cross exposed long line
- use service chord
- steal projection key

Implementation caution:

- no runtime scan math over full world
- shutters mutate local doors/cells only
- LOS/cover metrics required
