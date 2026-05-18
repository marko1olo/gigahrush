# AG95 Veretar Window Rescue Log

## Final Report - 2026-05-18

- Implemented a Living-zone POI module: `src/gen/living/veretar_window_rescue.ts`.
- Room creates a protected white-window apartment, one witness NPC, a local area-leak shortcut, Veretar sand/evidence, and a seal target.
- Player choices use existing systems:
  - rescue witness through the NPC side quest;
  - sample sand/evidence through owner containers, publishing witnessed container events;
  - seal by depositing `sealant_tube` into the white-seam container;
  - exploit shortcut through the white passage and shortcut evidence container;
  - ignore by leaving the room untouched.
- Added static aftermath rumors and mapped AG95 event tags/side quest ids in `src/systems/rumor.ts`.
- Validation:
  - Baseline `npm run typecheck` blocked: script missing.
  - `npm run check` blocked: script missing.
  - `npm run smoke` blocked: script missing.
  - `npx tsc --noEmit` fails on existing unrelated repo errors; targeted scan reports no AG95 touched-file diagnostics.
  - `npm run build` fails on existing missing export `proceduralAnomalyInteractionTargetId` imported by `src/render/hud.ts`.
