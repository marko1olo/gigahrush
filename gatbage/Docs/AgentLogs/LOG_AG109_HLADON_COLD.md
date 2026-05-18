# LOG AG109 HLADON COLD

## 2026-05-18

Implemented the AG109 Hladon cold pocket anomaly.

- Added `hladon` to procedural floor anomaly data with cold, heat-counter and route-pressure tags.
- Generated bounded Hladon rooms with pale frost marks, local fog, readable boundaries, cold apparatus controls and nearby warm preparation supplies.
- Added `src/systems/hladon.ts` for cached room-local cold masks, movement slow, needs pressure, passive counterplay, active clearing interaction and structured events.
- Integrated Hladon into movement, update, interaction, procedural anomaly event tags, floor-run pressure, HUD interaction target detection and debug summaries.
- Updated `README.md`, `Docs/ProceduralFloors/anomaly.md` and `Docs/Tasks/Status_AG109_HLADON_COLD.md`.

Validation:

- Baseline `npm run typecheck`: failed because the script is absent from `package.json`.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run check`: failed because the script is absent from `package.json`.
- `npm run test:unit`: failed because the script is absent from `package.json`.
- `npm run smoke`: failed because the script is absent from `package.json`.
