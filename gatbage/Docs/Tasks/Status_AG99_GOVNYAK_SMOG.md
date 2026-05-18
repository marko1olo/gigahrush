# AG99 Govnyak Smog Anomaly Status

Prompt: `AGENT_99_GOVNYAK_SMOG_ANOMALY`

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_99_GOVNYAK_SMOG_ANOMALY">` from `Docs/AgentPrompts/AGENT_99_GOVNYAK_SMOG_ANOMALY.md`.
- [x] Read `README.md` procedural floor section.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.3 and 16.4.
- [x] Read `Docs/ProceduralFloors/anomaly.md`.
- [x] Read `src/data/procedural_floors.ts`, `src/gen/procedural_floor.ts`, `src/render/hud_fx.ts`, and `src/systems/events.ts`.
- [x] Baseline `npm run typecheck`: failed before edits because `package.json` does not define a `typecheck` script.

## Implementation

- [x] Extended the existing `smog` procedural anomaly into a govnyak smog profile.
- [x] Replaced broad random smog fill with bounded rooms/corridor pockets and one source marker.
- [x] Added looter/monster pressure and contraband/filter loot clues around the source.
- [x] Added runtime cough pressure, filter/wet-cloth mitigation, source discovery and source shutoff.
- [x] Published smog entered, source found and source handled events.
- [x] Added HUD smog veil/indicator and debug/spec visibility.
- [x] Run final validation.

## Validation

- `npm run typecheck`: failed before edits; missing script.
- `npx tsc --noEmit`: passed.
- `npm run check`: blocked; missing script.
- `npm run smoke`: blocked; missing script.
- `npm run build`: passed.
