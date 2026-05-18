# AG66 Red Adhesive Trap Status

## Preflight

- Prompt XML block extracted: `AGENT_66_RED_ADHESIVE_TRAP`.
- Read: `README.md`, `architecture.md`, `desdoc.md` sections 16.1 and 18.
- Read required files: `src/core/world.ts`, `src/systems/samosbor.ts`, `src/systems/events.ts`, `src/gen/maintenance/content_helpers.ts`, `src/render/marks.ts`.
- Baseline `npm run typecheck`: failed before code edits because `package.json` has no `typecheck` script.

## Notes

- Existing surface marks can render adhesive cells without a new renderer-owned gameplay decision.
- Existing sparse `World` maps are suitable for rare cell data; no dense `World` array is planned.
- Implemented a sparse `systems/cell_hazards.ts` helper keyed by registered cell indices.
- Added `hazard_trapped`, `hazard_escaped`, and `hazard_cleaned` world events.
- Player movement and NPC path movement query current-cell hazard multipliers; NPC hazard state is scanned on a 0.25s accumulator, not every frame.
- Fire/explosions and the cleaning kit can clean registered hazard cells; trapped actors can also struggle free with a noisy event.
- Added Maintenance POI `НИИ слизи: красная липучка` through `src/gen/maintenance/red_adhesive_trap.ts`.

## Validation

- Baseline `npm run typecheck`: failed before code edits because the script is missing.
- `npm run check`: failed because the script is missing.
- `npx esbuild src/systems/cell_hazards.ts src/gen/maintenance/red_adhesive_trap.ts --bundle --format=esm --outdir=/tmp/gigahrush-ag66-check`: passed; latest run reported one unrelated duplicate key warning in `src/data/items.ts`.
- `npx tsc --noEmit --pretty false`: failed on existing unrelated errors, including missing exports from `systems/procedural_anomalies.ts`, unresolved names in `main.ts`/`faction_events.ts`, and unused imports in pre-existing modules.
- `npm run build`: failed on existing unrelated duplicate exports in `src/systems/procedural_anomalies.ts` (`proceduralAnomalyInteractionTargetId`, `tryUseProceduralFloorAnomaly`).
