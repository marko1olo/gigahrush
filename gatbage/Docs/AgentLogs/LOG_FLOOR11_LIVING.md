# LOG_FLOOR11_LIVING

## Final Report

Implemented the Living-floor expedition-prep slice as one additive module, `src/gen/living/expedition_prep.ts`, with a single side-effect import from `src/gen/living/content_manifest.ts`.

The new protected POI is `Пункт сборов вылазки` in Living zone HUD 52. It adds four NPCs with concrete route-prep dialogue: Лида Маршрутная for supply checks, Аня Герма for hermodoor prep, Миша Потеряшка for lost property, and Вера Возвратная for return evidence. The content remains a playable room with containers and item decisions instead of a DOM menu.

Added side quests:

- `floor11_prepare_expedition_supplies`: water before a route, rewarded with filter, route clue and 9mm.
- `floor11_hermodoor_repair`: hermo gasket for shelter prep, rewarded with door kit and sealant.
- `floor11_lost_property`: recover a key label, rewarded with child map and water coupon.
- `floor11_return_evidence`: bring a pressure logbook from a lower-route expedition; completion is visible in quest/event log and Vera has post-completion return dialogue.

The room uses `protectRoom()` and `aptMask`, places public/owner/locked containers, and does no frame-time scanning or DOM work.

Verification:

- Baseline `npm run build`: passed before implementation.
- `npm run typecheck`: passed after implementation.
- `npm run check`: passed after implementation, including typecheck, unit tests, Vite build, and smoke.

## Geometry Pass - 2026-05-18

Implemented the FLOOR11 Living geometry prompt as a local generator pass in `src/gen/living/geometry.ts`, called from `src/gen/living/index.ts` during both initial `generateWorld()` and `regrowMaze()`.

The Living hub now gets a readable structural grammar after the volatile maze is built: a loop around the protected act hall and armory, four district spokes, east market/service stalls, west apartment foyer blocks, a north public route and a south shelter route. The pass also draws routes toward available Living POIs by room name and to the nearest up/down lifts, while respecting `aptMask` and never carving through lift cells.

Approximate sampled geometry result: 21 repeated motifs, 6 landmark routes, 2 lift routes and 4 chokepoints. Initial and post-regrow runtime smoke kept 16 lifts and preserved the playable spawn. The regrow path rebuilds the same hub geometry after volatile wipe, so the new hub structure is not a one-time startup artifact.

Validation:

- `npx tsx` generator/regrow smoke: passed after final wiring.
- `npm run test:unit`: passed, 65 tests.
- `npm run typecheck` and `npm run check`: currently blocked by unrelated duplicate function implementations in `src/gen/design_floors/full_floor.ts`; no errors were reported for the new Living files.
- `npm run build && npm run smoke`: currently blocked by the same unrelated `full_floor.ts` duplicate declarations, so no final browser smoke was possible after the last call-order adjustment.
