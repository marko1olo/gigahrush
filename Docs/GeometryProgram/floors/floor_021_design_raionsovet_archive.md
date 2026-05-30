# Design Floor: `raionsovet_archive`

Route: z=+22, base `MINISTRY`, role "archives, card files, passes".

Primary source:

- `src/gen/design_floors/raionsovet_archive.ts`
- `Docs/DesignFloors/raionsovet_archive.md`
- `Docs/DesignFloors/rework_floor_07_raionsovet_archive.md`

Safe improvement target:

- Stack canyons, reading pits, clerk windows and document lanes.
- Macro-WFC shelf motifs.
- Wilson-braided archive stacks with landmarks.

Implementation notes:

- Avoid blind maze bloat; every serious maze section needs landmarks.
- Document ids and events must stay compact.
- Locked document chords optional, not route backbone.

Required decisions:

- File.
- Steal.
- Forge.
- Expose.
- Swap identity.
- Protect witness.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
