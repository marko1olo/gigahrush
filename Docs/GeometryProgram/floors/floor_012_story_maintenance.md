# Story Floor: `FloorLevel.MAINTENANCE`

Role: collectors, pipe maze, canals, machine rooms, panels, pressure and repair/reroute choices.

Primary source:

- `src/gen/maintenance/index.ts`
- `src/gen/maintenance/geometry.ts`
- `src/gen/maintenance/content_manifest.ts`
- `src/gen/maintenance/collectors_pressure_reroute.ts`
- `src/gen/maintenance/steam_valves.ts`

Safe improvement target:

- Split industrial geometry into service spine, pipe labyrinth, water basin and emergency-panel chord layers.
- Add Growing Tree, Hunt-and-Kill or Eller variants for coarse tunnel families.
- Add drainage proxy fields for flooded basins and dry causeways.

Implementation notes:

- Valves, substations and panels should sit at meaningful graph transition points.
- Pseudo-weaves are 2D: doglegs, bridge rooms, underpass chambers or rail gates.
- Runtime repair effects must be bounded and dirty-flagged.

Required gameplay result:

- Player chooses wet shortcut, dry long path, service duct, panel reroute or repair route.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
- Verify both lift directions and panel controls remain reachable.
