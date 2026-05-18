# AG47 Liquidator Archive Status

Prompt: `AGENT_47_MINISTRY_LIQUIDATOR_ARCHIVE`

## Preflight

- Extracted prompt XML block from `Docs/AgentPrompts/AGENT_47_MINISTRY_LIQUIDATOR_ARCHIVE.md`.
- Read `README.md`, `architecture.md`, and `desdoc.md` P0.3/P1.
- Read mandatory source files:
  - `src/gen/ministry/content_manifest.ts`
  - `src/gen/ministry/admin_common.ts`
  - `src/gen/ministry/inspection_archive.ts`
  - `src/data/contracts.ts`
  - `src/data/rumors.ts`
  - `src/systems/contracts.ts`
  - `src/systems/quests.ts`
  - `src/render/quest_ui.ts`
- Baseline `npm run build`: passed before edits.

## Implementation Notes

- Added `src/gen/ministry/liquidator_archive.ts` as the owned Ministry archive room.
- Registered it from `src/gen/ministry/content_manifest.ts`.
- Used existing item ids and container mechanics; no document database or plot-chain edit.
- Added L-47 system contracts for file inspection, token retrieval, Paragraph cleanup, and sealed-report theft.
- Added a records rumor/lead that points to the archive room, Paragraph danger, records container, and token.
- Kept the generic contract helper change to existing VISIT/event projection only.

## Validation

- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after edits.
- `npm run test:unit`: passed after edits.
- `npm run build`: passed after edits through `npm run check`.
- `npm run smoke`: failed in headless Chrome with blank WebGL canvas sampling after title/start; this remained outside the AG47 source path and should be rechecked with the renderer/smoke owner.
- Full `npm run check`: attempted; typecheck, unit tests, and build passed, but the command did not complete green because smoke failed.
