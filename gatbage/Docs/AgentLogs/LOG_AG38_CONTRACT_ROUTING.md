# LOG AG38 CONTRACT ROUTING

## 2026-05-17

Implemented generic contract target routing:
- Added contract target metadata propagation into quest fields.
- Added quest log route hints for contract target floors and player-facing target hints.
- Added bounded current-floor room-type markers in map rendering.
- Included contract target metadata in created/completed/failed event payloads.
- Added registry validation for contract target floor, room type, and hint metadata.

Validation:
- Baseline `npm run typecheck` passed before edits.
- `npm run check` passed content registry tests, including the new contract metadata assertions.
- Final `npm run check` is blocked by unrelated in-progress context/rumor edits: duplicate object keys in `src/systems/context.ts` and duplicate function implementations in `src/systems/rumor.ts`.
- Inspected the first three debug-spawn order hints:
  - `exp_living_emergency_roster`: `Цель на этом этаже. Жилая зона: общий коридор, аварийный ящик или комната укрытия.`
  - `exp_living_quarantine_message`: `Цель на этом этаже. Жилая зона: актовый зал и медпункт Ольги.`
  - `exp_living_shadow_stairwell`: `Цель на этом этаже. Жилая зона: коридоры между квартирами и убежищами.`
