# Design Floor: `manhattan_crossroads`

Route: z=+8, base `KVARTIRY`, role "city-like crossroads and route choices".

Primary source:

- `src/gen/design_floors/manhattan_crossroads.ts`
- `Docs/DesignFloors/manhattan_crossroads.md`
- `Docs/DesignFloors/rework_floor_09_manhattan_crossroads.md`

Safe improvement target:

- Treat current floor as canonical strong model.
- Add metrics/tests around crosswalk, toll, overpass, underpass and wrong-exit choices.
- Optional Hough/Radon false-road shell only if low-risk.

Implementation notes:

- No vehicle simulation.
- Crowd/monster pressure through placement fields and caps.
- Long LOS lanes need cover unless deliberately exposed.

Required decisions:

- Pay toll.
- Escort crosswalk.
- Rob cargo.
- Repair lights.
- Take wrong exit or reroute control.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
