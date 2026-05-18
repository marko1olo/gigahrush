# FLOOR09 Manhattan Crossroads

Status: implemented as standalone design-floor module; route integration remains future integrator work.

Preflight:
- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, and `Docs/DesignFloors/manhattan_crossroads.md`.
- Read required references: `src/gen/procedural_floor.ts`, `src/gen/shared.ts`, `src/render/marks.ts`, and `src/render/textures.ts`.
- Baseline `npm run build`: passed before FLOOR09 edits.

Implementation:
- Added `src/gen/design_floors/manhattan_crossroads.ts`.
- Exported `DESIGN_FLOOR_ID`, `MANHATTAN_CROSSROADS_DEBUG`, `getManhattanCrossroadsDebugLines()`, and `generateManhattanCrossroadsDesignFloor()`.
- Generated an indoor Manhattan road district with three long avenues, three cross streets, one east-only wrong-turn spur, sidewalks/service edges, blocks, lift pavilions, a cargo garage, a junction-control post, a kiosk and a wrong-turn exit.
- Used existing texture ids only: dark asphalt via `Tex.DARK`, concrete sidewalks, tile-based road stripes and sparse high-resolution white surface overlays.
- Added divider lines and zebra crossings. The minimap path is supported by logical room-map coloring for road marks; raycaster readability is supported by floor textures plus 952 surface-mark cells, below the 1024-cell surface atlas cap.
- Registered NPC/quest content in the module for future import: junction control, zebra escort, stolen cargo and wrong-turn visit.

Gameplay:
- `crossroads_traffic_militsiya`: repair/bribe-style junction control through a fuse fetch.
- `crossroads_zebra_granny`: escort-like TALK route across the crossings to Dima.
- `crossroads_courier_dima`: stolen cargo recovery from the garage.
- `crossroads_road_stalker_ksu`: wrong-turn VISIT to the spur room.
- Static hazards include REBAR, SHADOW, NELYUD and EYE placement near cargo/wrong-turn pressure points. No vehicle physics or traffic simulation were added.

Validation:
- Targeted strict compile of `src/gen/design_floors/manhattan_crossroads.ts`: passed.
- Targeted runtime generation smoke: passed; generated 16 entities, 15 rooms, 3 containers and 952 surface-mark cells.
- Reachability smoke from spawn: passed for `Пост управления перекрестком`, `Безопасный бордюр у зебры`, `Гараж украденного груза`, and `Съезд Неправильный поворот`.
- Post-change `npm run build`: passed.
- Full `npm run typecheck`: blocked outside FLOOR09 by `src/gen/design_floors/chthonic_attic.ts(273,9): 'evidenceDoor' is declared but its value is never read.`
- `npm run check`: blocked at the same unrelated typecheck error before unit/build/smoke stages.
