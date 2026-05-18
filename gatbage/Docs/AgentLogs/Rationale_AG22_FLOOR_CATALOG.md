# Rationale AG22 Floor Catalog

Date: 2026-05-17

## Decisions

The catalog is pure data in `src/data/floor_catalog.ts`. This keeps future floor ideas out of `FloorLevel` and avoids adding generators before a pocket proves a playable loop.

`baseFloor` uses the existing `FloorLevel` enum instead of string floor names. Debug formatting uses `floorLevelDisplayName()` from `src/gen/floor_manifest.ts`, so floor names are not duplicated.

Runtime helpers live in `src/systems/floor_catalog.ts` because they are generic query/formatting functions over definitions. They do not mutate world state and should not run per frame.

Debug inspection was attached to the existing command 14 rather than adding a new menu slot. `main.ts` currently clamps debug selection to 14 commands, and the task write scope did not include `main.ts`. The command now preserves the balance output and appends catalog listing/search output.

## Entry Quality

The catalog uses 28 entries, not every possible joke number. Entries that would only be a renamed corridor were skipped. Every kept id implies at least one distinct rule, visual or loop through its id, tags and unlock hint: map lies, pressure queues, red-service combat, luck traps, radio DATA, debt markets, evacuation, quarantine, archive identity, production defects, roof exposure, labor schedules, food/mold production, wrong stations, valve heat, void protocols, vertical courtyards, laundry contamination, stealth staircases, quiet escort, morgue identity swaps, counterfeit printing, cult rerouting, elevator repair, lost-property memory, ration crowds, pump rhythm and timed demolition.

## Rejected Alternatives

Adding `FloorLevel.NUMBERED_404`, `FloorLevel.SCHOOL`, or similar values was rejected because the prompt explicitly forbids enum churn without real generators and user approval.

Adding a generic pocket spawn route was rejected because safe transition, save fallback, map truth and generator ownership are separate integration tasks.

Duplicating `FLOOR_NAMES` inside the catalog was rejected. The system formatter imports the manifest helper.

## Performance

Inactive runtime cost is 0 us/frame. Query cost is linear over 28 definitions and is used by debug or future rare/generation-time consumers, not hot update/render paths.
