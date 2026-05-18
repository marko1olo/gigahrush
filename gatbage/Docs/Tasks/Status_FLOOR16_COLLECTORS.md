# FLOOR16 Collectors Status

Prompt: `FLOOR16_COLLECTORS`

Preflight:
- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, and `Docs/DesignFloors/collectors.md`.
- Read requested source references: `src/gen/maintenance/content_manifest.ts`, `pressure_station.ts`, `water_bridge.ts`, `overflow_sluice.ts`, and `src/entities/tube_eel.ts`.
- Baseline `npm run build`: passed before edits.

Implementation:
- Added `src/gen/maintenance/collectors_pressure_reroute.ts`.
- Wired `generateCollectorsPressureReroute()` through `src/gen/maintenance/content_manifest.ts`.
- Added the Collector node POI: valve room, flooded map room, tube hunter post, filter run, debtor parts room, bounded water, containers and three water-placed `TUBE_EEL` spawns.
- Registered NPC quest packs for Varja pressure permits, the drowned cartographer, Ilyas tube hunting and Fedya stolen parts.
- Added the drain choice event observer: completing the Living or Kvartiry reroute quest changes `drink_water` stock on the affected remote floors and publishes a `room_lacked_resources` scarcity/access event tagged by floor id.

Validation:
- `npm run typecheck`: passed.
- `npm run test:unit`: passed.
- `npm run build`: passed.
- `npm run smoke`: passed.
- `npm run check`: passed.

