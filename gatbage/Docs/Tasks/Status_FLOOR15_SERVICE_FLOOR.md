# FLOOR15_SERVICE_FLOOR Status

Date: 2026-05-18
Status: implemented as self-contained design-floor module.

## Files

- `src/gen/design_floors/service_floor.ts`
- `Docs/Tasks/Status_FLOOR15_SERVICE_FLOOR.md`
- `Docs/AgentLogs/LOG_FLOOR15_SERVICE_FLOOR.md`

## Implemented

- Added `generateServiceFloorDesignFloor()` for future route id `service_floor`, anchor `z=16`.
- Stamped a compact backstage layout: west/east service lifts, lift machine hall, breaker room, janitor depot, ventilation junction, staff canteen and raid dispatcher office.
- Added Boris, Nadya, Roma and Pavel as side-quest NPCs through `registerSideQuest`.
- Added quests for lift repair, scoped master-key access, raid reroute and light restoration.
- Added local `ServiceFloorState` flags:
  - `liftMachineState`
  - `masterKeyKnown`
  - `powerZones`
  - `rerouteFlags`
  - scoped door/container ids
- Added event-publishing helpers:
  - `repairServiceLiftMachine()`
  - `learnServiceMasterKey()`
  - `restoreServicePowerZone()`
  - `rerouteServiceRaid()`
- Added `summarizeServiceFloorFlags()` for debug output by a future integrator.

## Access Scope

The master-key content does not use the current generic door key path. The existing door interaction treats any `key` as enough for any locked door, so this module records only its own scoped door/container ids and exposes `applyServiceMasterKeyScope()` to open those records only.

Scoped rooms:

- `Кладовая дежурных ключей С-15`
- `Запертая диспетчерская рейдов С-15`

## Integration Notes

- This module does not edit `main.ts`, lift travel, save/load or `FloorLevel`.
- Containers use `FloorLevel.MAINTENANCE` as the current enum-compatible base floor until an integrator adds string-id authored design floors.
- The repair/reroute/light helpers publish existing `WorldEventType` values with `service_floor` tags rather than adding core event enums.

## Validation

- Baseline before edits: `npm run build` passed.
- Final `npm run build` passed.
- Initial post-implementation `npm run typecheck` passed.
- Targeted compile for `src/gen/design_floors/service_floor.ts` passed:
  `npx tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --types node src/gen/design_floors/service_floor.ts`.
- Final full-tree `npm run typecheck` rerun is blocked by unowned `src/gen/design_floors/chthonic_attic.ts:273`, where `evidenceDoor` is declared but unused.
- `npm run check` not run because no shared systems, rendering, save/load, AI, inventory, economy or route code was changed, and the full-tree typecheck is currently blocked outside this prompt's write scope.
