# FLOOR16 Collectors Final Report

Date: 2026-05-18

Implemented:
- Added `src/gen/maintenance/collectors_pressure_reroute.ts`.
- Added one Maintenance manifest runner entry for `generateCollectorsPressureReroute()`.

Gameplay result:
- Maintenance now has a Collector pressure node with a clear valve decision: route pressure to `living` or to `kvartiry`.
- The first completed drain quest adjusts `drink_water` economy stock on both remote floors and publishes a scarcity/access event with `target_floor:*` and `scarcity_floor:*` tags.
- The POI contains pressure permits, flooded route mapping, tube eel hunting, stolen pressure parts, filter delivery, owner containers and bounded tube eel spawns.
- The layout uses dry walkways around water trays, so the floor remains navigable after the choice because the consequence is economy/event state, not topology mutation.

Validation:
- Baseline `npm run build`: passed before edits.
- `npm run check`: passed after implementation.

