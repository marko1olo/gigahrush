# Story Floor: `FloorLevel.LIVING`

Role: central inhabited survival baseline, permanent apartments plus volatile samosbor-regrown megastructure.

Primary source:

- `src/gen/living/index.ts`
- `src/gen/living/apartments.ts`
- `src/gen/living/volatile.ts`
- `src/gen/living/geometry.ts`
- `src/gen/living/content_manifest.ts`

Safe improvement target:

- Add macro route intent before volatile maze stamping: hub ring, market lane, shelter lane, public lane, service bypass and reward dead ends.
- Improve apartment-to-public routing with weighted connector paths that forbid `aptMask`, hermetic walls, lifts and protected interiors.
- Add generation-time shelter-shell metrics around hermetic rooms.

Implementation notes:

- Do not delete or repurpose permanent apartments.
- Do not make samosbor erase `aptMask` or hermetic walls.
- Geometry changes are generation-time. Runtime samosbor must continue to use the existing rebuild/splice path.
- Broad population remains A-Life/template based; no refill.

Required gameplay result:

- Player can read routes from spawn to act hall, armory, Yakov, Vanka, market and lifts.
- Public, service and shelter routes are visibly different.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check` for generator changes
- Verify no apartment cluster is unreachable after volatile maze generation.
