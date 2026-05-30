# Design Floor: Пионерлагерь

Status: implemented authored route floor. Route id: `pioneer_camp`. Anchor: `z=+38`. Base floor: `LIVING`. Shipped HUD name: `Пионерлагерь`.

Owned file: `src/gen/design_floors/pioneer_camp.ts`. Route integration: `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/design_floors/full_floor.ts`.

## Shipped Facts

`pioneer_camp` is an upward-route stop above `upper_bureau` and below `antenna_court`. It occupies `z=+38`; `antenna_court` is shipped at `z=+42`.

The generator builds a Soviet summer-camp pocket with generic camp grammar, not copied third-party names. It includes:

- central lineup square, gate, canteen, infirmary, library, radio club, music club, stage, bathhouse, boat station, sport ground and locked old cabin;
- an explicit loudspeaker point and camp storage shed connecting the roster, repair, canteen and old-cabin routes;
- Tamara Smennaya, Egor Radio Club, Ira Medpost and Zoya Canteen as registered side-quest NPCs;
- fetch quests for shelter roster, loudspeaker wire, sanitary kit and pressed sugar;
- owned camp containers for food, medicine and radio repair supplies, plus document and old-cabin stashes;
- a larger route expansion with trail loops, cabin rooms, posters, lights, Poisson-spaced concrete-forest trail points and BFS safe/buffer/wild trail shells.

## Implementation Boundary

The floor uses existing NPC, quest, container, monster, lift and route-expansion systems. There is no separate camp schedule simulation.

Use the normal lift route to `z=+38` or debug route teleport to `pioneer_camp`. Spawn starts at `Ворота и остановка лагеря`.
