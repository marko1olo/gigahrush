# Story Floor: `FloorLevel.HELL`

Role: meat lower story anchor, organic combat floor, arena chains, fallback loops and corrupt shelter cues.

Primary source:

- `src/gen/hell/index.ts`
- `src/gen/hell/geometry.ts`
- `src/gen/hell/content_manifest.ts`
- `src/gen/hell/plot_chain.ts`

Safe improvement target:

- Couple cave/noise valleys to arena-chain graph.
- Add reaction-diffusion material overlays as generation-time texture/feature/pressure anchors.
- Score arena chains before stamping: entry, threat, fallback, reward, exit and alternate sightline.

Implementation notes:

- Do not change `underhell` or `podad` gate semantics from this packet.
- Keep dynamic topology in existing anomaly systems, not Hell-only frame loops.
- Monster placement must respect caps.

Required gameplay result:

- Combat arenas are readable and give retreat/fallback decisions rather than one tunnel chain.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- Verify spawn/lift/fallback route is reachable after organic shaping.
