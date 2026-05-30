# Design Floor: `dark_metro`

Route: z=-32, base `MAINTENANCE`, role "dangerous short transit".

Primary source:

- `src/gen/design_floors/dark_metro.ts`
- `src/gen/maintenance/metro_error_line.ts`
- `Docs/DesignFloors/dark_metro.md`
- `Docs/Expansions/02_metro_error_line/`

Safe improvement target:

- Line Ys, ticket halls, transfer web, defended platforms and rail threat.
- Parallel rail graph with transfer nodes.
- Lit-platform BFS safety shells.

Implementation notes:

- Preserve existing train/crush mechanics.
- Train-cell maps must rebuild/clear after transitions.
- Platform safety must be visually readable.

Required decisions:

- Ride.
- Walk.
- Wait/flee.
- Lure monsters to rails.
- Rescue stranded NPC.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- `npm run check:browser` if rail visuals/readability change.
