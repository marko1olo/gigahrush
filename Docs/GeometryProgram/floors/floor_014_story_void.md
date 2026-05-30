# Story Floor: `FloorLevel.VOID`

Role: sparse final story anchor, protocol chambers, light scarcity, low social presence and endgame pressure.

Primary source:

- `src/gen/void/index.ts`
- `src/gen/void/content_manifest.ts`
- `src/gen/void/protocol_chamber.ts`
- `src/gen/void/borrowed_light_rule.ts`

Safe improvement target:

- Build sparse island/protocol graph instead of simply using fewer rooms.
- Use proxy percolation/largest-component extraction, then insert explicit bridges for route anchors.
- Add light/reveal BFS shells and dead-lamp rows.

Implementation notes:

- Keep NPC-free late-route identity where route rules require it.
- Low light may scare the player, but route-critical geometry must remain testable.
- Browser readability check is required if render/light behavior changes.

Required gameplay result:

- Player chooses light pocket, listening route, fast dark crossing, fallback bridge or protocol chamber route.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- `npm run check:browser` for light/readability changes.
