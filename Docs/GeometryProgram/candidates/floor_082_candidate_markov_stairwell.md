# Candidate Floor: `markov_stairwell`

Recommended form: authored design floor or procedural geometry profile.

Base floor: `FloorLevel.LIVING`, `FloorLevel.KVARTIRY` or `FloorLevel.MINISTRY`.

Fantasy: route stop where room sequence feels probabilistic and learnable.

Algorithm stack:

- Markov chain over room motifs
- hidden danger states
- loop graph embedding

Gameplay decisions:

- learn sequence tell
- interrupt chain through service door
- exploit rare state
- find stash by pattern

Implementation caution:

- deterministic from seed
- no runtime Markov process unless local puzzle owns it
