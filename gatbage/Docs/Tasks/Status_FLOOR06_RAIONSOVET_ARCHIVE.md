# FLOOR06_RAIONSOVET_ARCHIVE Status

Date: 2026-05-18
Route id: `raionsovet_archive`
Owned source: `src/gen/design_floors/raionsovet_archive.ts`

## Implemented

- Added standalone `generateRaionsovetArchiveDesignFloor()` for the future design-floor route without wiring a new `FloorLevel`.
- Built archive stacks, catalog corridors, clerk windows, locked living shelves, stamp room, infected shelf aisle, checker post and Market 88 license niche.
- Added named NPC quest registrations for:
  - `archive_get_floor_permit`
  - `archive_swap_card`
  - `archive_save_or_burn`
  - `archive_market_license`
- Added compact local document/flag definitions for route permits, apartment rights, burned shelves and Market 88 license state.
- Added legal and illegal access checks:
  - legal `archive_access_permit` front access to living shelves;
  - illegal `forged_stamp_sheet` back access to the same shelves;
  - legal/illegal Market 88 license records.
- Added document containers with access/risk tags and hostile archive pressure via `PARAGRAPH` and `PECHATEED`.
- Added `publishRaionsovetArchiveEvent()` bridge using existing `publishEvent()` with archive route/target tags.

## Verification

- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after adding the Raionsovet archive file, before concurrent unowned design-floor files appeared.
- Direct strict typecheck of `src/gen/design_floors/raionsovet_archive.ts`: passed after final edits.
- `npm run check`: blocked during typecheck by unowned concurrent files:
  - `src/gen/design_floors/dark_metro.ts`: unused `LIGHT_BITS`
  - `src/gen/design_floors/floor_69.ts`: unused `weapon`

## Notes

This slice is intentionally self-contained. It does not modify save schema, `FloorLevel`, floor manifests, `main.ts`, shared systems or README shipped-behavior docs.
