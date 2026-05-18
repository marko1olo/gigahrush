# LOG_FLOOR19_UNDERHELL

## 2026-05-18

Implemented a standalone Underhell design-floor module at `src/gen/design_floors/underhell.ts`.

Key results:

- Exported `generateUnderhellDesignFloor()`, `UNDERHELL_DEBUG_ENTRY` and compact ritual flag helpers.
- Added concrete threshold costs: `holy_water`, `passport_stub`, or `blood_35hp`.
- Added side-quest registrations for `underhell_threshold_marfusha`, `underhell_debt_cultist`, `underhell_wordless_liquidator` and `underhell_false_yakov_echo`.
- Added generated landmarks for root tunnels, sealed witness cells, black wells, the debt furnace, inverted chapel and deterministic Void gate cell.
- Added helper APIs to pay the threshold, rescue or silence witnesses, burn debt with backlash, break the Void anchor and open the gate.
- Kept all route/debug/save integration out of scope per prompt.

Validation:

- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after implementation.
- Post-change `npm run build`: passed.
- `npm run check`: skipped because no route/system/save/render wiring was changed.
