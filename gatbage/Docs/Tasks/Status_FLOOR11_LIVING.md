# Status_FLOOR11_LIVING

Prompt: `Docs/DesignFloors/AgentPrompts/floor11_living.md`
Domain: Living-floor expedition preparation / hub route prep.
Write scope: new additive Living module, Living content manifest import, this status file, final agent log.

## Preflight

- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, and `Docs/DesignFloors/living.md`.
- Read source references: `src/gen/living/content_manifest.ts`, `src/gen/living/zone_content.ts`, `src/gen/living/tutor_room.ts`, `src/systems/quests.ts`, plus local Living quest/content examples.
- Baseline `npm run build`: passed before implementation.

## Implementation

- Added `src/gen/living/expedition_prep.ts`.
- Registered it from `src/gen/living/content_manifest.ts`.
- New protected Living POI: `Пункт сборов вылазки`, zone HUD 52.
- New NPCs: Лида Маршрутная, Аня Герма, Миша Потеряшка, Вера Возвратная.
- New side quests:
  - `floor11_prepare_expedition_supplies`: bring water, receive filter, route and 9mm.
  - `floor11_hermodoor_repair`: bring hermo gasket, receive door kit and sealant.
  - `floor11_lost_property`: recover a key label, receive child map and water coupon.
  - `floor11_return_evidence`: bring pressure logbook from a lower-route expedition, visible through quest log/event completion and Vera's post-completion dialogue.
- Added public, owner and locked containers for prep supplies, repair materials, route records and lost property.

## Validation

- `npm run typecheck`: passed after implementation.
- `npm run check`: passed after implementation.
  - Typecheck passed.
  - Unit tests passed.
  - Vite single-file build passed: 229 modules, `dist/index.html` 1,326.42 kB, gzip 393.26 kB.
  - Smoke passed: `hudLit=6197`, `hudCenterLit=128`, `sceneLit=202145`.

## Geometry Pass - 2026-05-18

Prompt: `gatbage/Docs/DesignFloors/AgentPrompts/floor_11.md`
Scope note: active `Docs/Tasks` and `Docs/AgentLogs` were not recreated; this archived status/log pair was updated instead, matching current `README.md` documentation policy.

Changed files:

- `src/gen/living/geometry.ts`
- `src/gen/living/index.ts`
- `gatbage/Docs/Tasks/Status_FLOOR11_LIVING.md`
- `gatbage/Docs/AgentLogs/LOG_FLOOR11_LIVING.md`

Implementation:

- Added a Living-only hub geometry pass that runs after volatile maze generation and zone content, before random side-quest NPC and procedural screen passes.
- The pass rebuilds after `regrowMaze()`, so samosbor volatile wipes restore the same readable hub structure instead of erasing it.
- Macro shape: a loop around the act hall/armory, four district spokes, two outer loop connectors, market/service strip east, apartment foyer blocks west, public POI corridor north and shelter cells south.
- Approximate generated motifs/routes in a sampled run: 21 motifs, 6 landmark routes, 2 lift routes, 4 chokepoints. Initial generation kept 16 lifts and produced a playable spawn at `[512.5, 515.5]`; regrow also kept 16 lifts.

Validation:

- `npx tsx ... generateWorld/regrowMaze smoke`: passed after final wiring. Initial sample: `rooms=10473`, `floor=412003`, `lift=16`, `lit=1025879`; regrow sample: `rooms=20561`, `floor=400570`, `lift=16`, `lit=1014387`.
- `npm run test:unit`: passed, 65 tests.
- `npm run typecheck`: failed in unrelated files outside FLOOR11 scope; no `src/gen/living/index.ts` or `src/gen/living/geometry.ts` errors were reported. Current failure is duplicate function implementations in `src/gen/design_floors/full_floor.ts` at lines 175, 179, 220, 231, 238, 250, 473, 486, 499, 525, 644 and 660.
- `npm run check`: failed at the typecheck step for the same unrelated `full_floor.ts` duplicate implementations, before tests/build could run inside the chained command.
- `npm run build && npm run smoke`: blocked after final wiring by unrelated duplicate symbol declarations in `src/gen/design_floors/full_floor.ts`; a previous build/smoke before the final call-order adjustment had passed, but it is not counted as final validation.
