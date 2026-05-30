# Story Floor: `FloorLevel.KVARTIRY`

Role: dense residential pressure, queues, riots, social chaos and small-room crowd geometry.

Primary source:

- `src/gen/kvartiry/index.ts`
- `src/gen/kvartiry/content_manifest.ts`
- `src/gen/kvartiry/social_pressure.ts`
- `src/gen/kvartiry/social_helpers.ts`

Safe improvement target:

- Add a social macro graph over existing rooms: kitchens, water points, ration queues, barricades, lifts and print rooms.
- Add braided queue loops without replacing the dense wall-grid identity.
- Add Potts/Ising social domains as generation-time room/zone tags or debug descriptors.

Implementation notes:

- Keep the floor cramped and residential.
- Do not pile actors into one arena; use placement fields and caps.
- Do not create refill when crowds die.
- Avoid one ordinary door owning both lift routes.

Required gameplay result:

- Player can choose crowd route, apartment cut-through, service/barricade detour or risky shortcut.
- Riot/social pressure is visible from geometry before NPC behavior starts.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- Add/verify articulation metric for large isolated regions.
