# AG99 Govnyak Smog Anomaly Log

## 2026-05-18

- Extended the existing procedural `smog` anomaly into `говнячный смог` with smog/govnyak/contraband tags and filter/cloth/valve loot bias.
- Reworked procedural smog generation from broad random fog into bounded affected rooms, corridor pockets and one apparatus source marker stored on `World`.
- Added source-side looters, smog-biased monsters and contraband/filter clue drops.
- Added runtime smog pressure: entry/source/handled events, cough HP/water pressure, gasmask filter mitigation and auto-prepared wet cloth if the player carries cloth plus water.
- Added source shutoff through the existing procedural anomaly interaction path.
- Added HUD smog veil/indicator, render fog-density bonus while inside smog, debug forced-smog teleport and debug smog summary lines.
- Updated `Docs/ProceduralFloors/anomaly.md` to describe smog as bounded source-driven anomaly behavior.

Validation:
- `npm run typecheck`: missing script before edits.
- `npx tsc --noEmit`: passed.
- `npm run check`: missing script.
- `npm run smoke`: missing script.
- `npm run build`: passed.
