# Status: FLOOR04_UPPER_BUREAU

Date: 2026-05-18

## Scope

- Implemented `src/gen/design_floors/upper_bureau.ts`.
- Kept changes out of shared systems, Ministry content and core floor enums.
- The floor remains a future design-floor module; it is not wired into `FloorLevel` or the live route.

## Implemented

- Exported `generateUpperBureauDesignFloor()`.
- Built a compact high-status administrative layout:
  - waiting salon;
  - executive decision office;
  - zero file room with restricted containers;
  - audit office;
  - cleaner closet;
  - staff-only route;
  - gated shelter and future service-lift hook.
- Added named NPC definitions and side-quest registrations:
  - `bureau_madam_iskra` for preapproval and acceleration-fee access;
  - `bureau_cleaner_tolik` for cleaner keys, staff route and Market 88 warning;
  - `bureau_auditor_lev` for audit pressure;
  - `bureau_visitor_anna` for erased-name and exposed-record outcomes.
- Represented access outcomes with existing document items and exported local flags:
  - `official_permit_slip`;
  - `forged_permit_slip`;
  - `key`;
  - `elevator_access_order`;
  - `denunciation`;
  - `missing_record_file`;
  - `record_exposure_notice`.
- Added local flag helpers:
  - `createUpperBureauFlags()`;
  - `applyUpperBureauFlagChange()`;
  - `upperBureauDebugLine()`.
- `applyUpperBureauFlagChange()` publishes a structured existing event (`faction_relation_changed`) with `upper_bureau`, `audit_heat` and `record_edit` tags when audit heat, route flags or erased-name state changes.

## Gate Design

The main appointment gate has three playable approaches:

- Legal: bring an official permit slip to Madam Iskra and receive quiet keyed access.
- Social/economic: pay the acceleration fee for access with audit trace.
- Illegal/combat: steal from owner/faction containers or kill/rob the gate guard, raising theft/combat pressure through existing systems.

Quiet stealth is supported by Tolik's cleaner-key route through the staff corridor. Only the main appointment post and staff checkpoint are locked; the file room uses owner/faction containers and room pressure instead of another universal door lock.

## Validation

- Baseline `npm run build`: passed before implementation.
- Direct Upper Bureau compile:
  - `npx tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --types node src/gen/design_floors/upper_bureau.ts`
  - passed.
- Full `npm run typecheck`: blocked by an unrelated untracked file, `src/gen/design_floors/antenna_court.ts`, due to unused `DoorState` import.
- `npm run check`: not run because no shared systems/render/save/generation hooks were changed and full typecheck is currently blocked upstream.
