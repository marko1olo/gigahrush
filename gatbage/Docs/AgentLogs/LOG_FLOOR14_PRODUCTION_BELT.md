# FLOOR14_PRODUCTION_BELT Log

Date: 2026-05-18

## Summary

Implemented the authored Production Belt design-floor module in `src/gen/design_floors/production_belt.ts`.

## Gameplay Added

- Exported `generateProductionBeltDesignFloor()`, `DESIGN_FLOOR_ID`, `PRODUCTION_BELT_DEBUG_ENTRY` and local factory-line metadata.
- Stamped a compact production floor with a pass gate, transport corridor, foreman office, lockers, metal restoration line, charge line, illegal ammo line, loading dock, worker shelter, bad-batch quarantine, audit post and exit dock.
- Registered four named NPCs through the existing side-quest registry:
  - `prod_foreman_galina`
  - `prod_mechanic_rustam`
  - `prod_worker_egor`
  - `prod_auditor_bot`
- Added four side quests:
  - `prod_restore_line`
  - `prod_steal_crate`
  - `prod_bad_batch`
  - `prod_worker_escort`
- Added owned/faction/public containers, including three production output containers tagged for existing factories:
  - `metal_shop`
  - `utility_room`
  - `illegal_ammo_smelter`
- Added route pressure through ROBOT, REBAR and SBORKA spawns plus bad-batch fog/water residue.

## Boundedness

- No conveyor simulation.
- No per-frame scanning.
- Production is room/container/tag driven through existing `systems/production.ts` discovery.
- Containers use existing owner/faction access and theft event behavior.

## Validation

- Baseline `npm run build`: passed before source edits.
- `npm run check`: passed after implementation.
- Direct compiled generator sanity check:
  - spawn cell: floor
  - rooms: 12
  - entities: 24
  - named NPCs: 4
  - production rooms: 3
  - production output containers: 3

## Notes

- The design floor is not wired into the current story `FloorLevel` route. It uses `FloorLevel.MAINTENANCE` as the current base floor for container and production compatibility until an integrator adds string-route travel.
