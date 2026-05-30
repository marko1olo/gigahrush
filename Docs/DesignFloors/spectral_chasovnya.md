# Spectral Chasovnya

Status: shipped authored route-floor implementation.

Source candidate: `Docs/GeometryProgram/candidates/floor_089_candidate_spectral_chasovnya.md`.

Route facts:

- Route id: `spectral_chasovnya`
- z: `-42`
- Base floor: `FloorLevel.HELL`
- Generator: `src/gen/design_floors/spectral_chasovnya.ts`
- Role: sound, cult and hearing geometry.

Implementation:

- Central chapel POI with entry, nave, bell cage, radio sacristy, acoustic-shadow side rooms, sound-focus arch, crypt and lower exit.
- Topology state records graph-Laplacian inspired acoustic bands, standing-wave rooms, acoustic shadow zones and bell nodes for tests/debug.
- Main bell and crypt handbell use the existing content-interaction hook. Ringing a bell publishes a bounded `siren` noise record and `monster_bait_placed` event; it does not run a full acoustic solver.
- Existing sound-aware monster systems do the runtime work: the floor biases toward `SLEPOGLAZ`, `TUMANNIK`, `SPIRIT`, shadows and choir pressure.
- `spectral_bellwarden_miron` provides the player-facing quest hook for bringing a `sound_emitter` to the radio sacristy.

Player decisions:

- Move silently through acoustic-shadow rooms to avoid the focus arch.
- Ring a bell to pull sound-focused threats toward a local bait pulse, then move.
- Use the radio sacristy for hearing and noise-counterplay loot.
- Fight or avoid the focus arch where loud weapons are risky.
