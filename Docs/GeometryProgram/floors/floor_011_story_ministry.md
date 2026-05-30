# Story Floor: `FloorLevel.MINISTRY`

Role: bureaucratic maze, permits, offices, queues, document gates and hostile legibility.

Primary source:

- `src/gen/ministry/index.ts`
- `src/gen/ministry/geometry.ts`
- `src/gen/ministry/content_manifest.ts`
- `src/gen/ministry/queue_hall.ts`
- `src/gen/ministry/document_gate.ts`

Safe improvement target:

- Split Ministry geometry into explicit graph roles: office BSP, queue hall, archive stack and staff-only chord.
- Add landmark rooms by graph depth/centrality: portrait hall, seal cabinet, clerk cage, copying room, complaint pit.
- Use Wilson/Prim style archive subgraphs only on coarse grids.

Implementation notes:

- Route backbone to lifts must stay ungated.
- Permit/key doors are optional chords, vault leaves or dangerous shortcuts.
- Use ids/events for document facts; avoid display-name lookups in hot logic.

Required gameplay result:

- Legal queue, staff stealth, document theft and combat route are all possible.
- Maze pressure is fair enough to navigate by landmarks.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- Verify one locked door cannot softlock the floor.
