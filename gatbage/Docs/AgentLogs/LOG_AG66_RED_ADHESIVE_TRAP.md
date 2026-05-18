# AG66 Red Adhesive Trap Log

## 2026-05-18

- Added a bounded sparse cell hazard helper in `src/systems/cell_hazards.ts`.
- Added red adhesive trap event types and world-log/HUD presentation.
- Connected hazard movement multipliers to player movement and shared NPC path movement.
- Added fire/explosion cleanup and cleaning-kit solvent cleanup.
- Added the Maintenance POI `НИИ слизи: красная липучка` with visible red floor marks, route-around lanes, nearby cleanup resources, loot pressure, and an ambient NPC.
- Registered the POI in the Maintenance content manifest.
- Validation:
  - `npm run typecheck`: missing script.
  - `npm run check`: missing script.
  - Targeted esbuild bundle for the new helper/content files passed, with one unrelated `src/data/items.ts` duplicate-key warning on the latest run.
  - `npx tsc --noEmit --pretty false` failed on pre-existing unrelated project errors.
  - `npm run build` failed on pre-existing duplicate exports in `src/systems/procedural_anomalies.ts`.
