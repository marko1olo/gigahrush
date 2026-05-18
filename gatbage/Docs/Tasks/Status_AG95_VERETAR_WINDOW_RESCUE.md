# AG95 Veretar Window Rescue Status

Prompt: `Docs/AgentPrompts/AGENT_95_VERETAR_WINDOW_RESCUE.md`

## Preflight

- Extracted XML block id `AGENT_95_VERETAR_WINDOW_RESCUE`.
- Read `README.md`, `architecture.md`, `veretar.md`, `desdoc.md` section 16.3, `src/gen/living/zone_content.ts`, `src/gen/kvartiry/content_manifest.ts`, `src/data/plot.ts`, `src/systems/events.ts`, `src/systems/rumor.ts`.
- Baseline `npm run typecheck`: blocked before edits because `package.json` has no `typecheck` script.

## Implementation Notes

- Target floor: Living zone via zone content registry.
- POI shape: protected room with a white window leak, one witness NPC, sample/seal containers, and a bounded white shortcut passage.
- Outcome channels: existing side quest completion, container sample/deposit events, Veretar tags, and rumor mapping.

## Completed

- Added `src/gen/living/veretar_window_rescue.ts`.
- Added Living manifest import in `src/gen/living/content_manifest.ts`.
- Added Veretar-window aftermath rumors in `src/data/rumors.ts`.
- Added AG95 side-quest/container tag mapping in `src/systems/rumor.ts`.

## Validation

- `npm run typecheck`: blocked before edits; `package.json` has no `typecheck` script.
- `npm run check`: blocked after edits; `package.json` has no `check` script.
- `npm run smoke`: blocked after edits; `package.json` has no `smoke` script.
- `npx tsc --noEmit`: failed on pre-existing unrelated files (`src/main.ts`, `src/systems/faction_events.ts`, `src/render/hud.ts`, etc.). A targeted scan found no diagnostics mentioning AG95 touched files.
- `npm run build`: failed on pre-existing export mismatch: `src/render/hud.ts` imports `proceduralAnomalyInteractionTargetId` from `src/systems/procedural_anomalies.ts`, but that export is missing.
