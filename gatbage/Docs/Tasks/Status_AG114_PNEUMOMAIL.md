# AG114 Pneumomail Rumor Chain Status

Prompt: `AGENT_114_PNEUMOMAIL_RUMOR_CHAIN`

## Preflight

- XML block identified from `Docs/AgentPrompts/AGENT_114_PNEUMOMAIL_RUMOR_CHAIN.md`.
- Read: `README.md`, `architecture.md`, `desdoc.md` sections 13 and 16.6.
- Read: `src/systems/rumor.ts`, `src/data/rumors.ts`, `src/data/contracts.ts`, `src/systems/contracts.ts`, `src/gen/maintenance/metro_error_line.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.

## Implementation

- Added `src/data/pneumomail.ts` with six bounded capsule definitions: true lead, false lead, contract, empty tube, contraband note and warning.
- Added `src/gen/maintenance/pneumomail_station.ts` and registered it from the Maintenance content manifest.
- Added `src/systems/pneumomail.ts` with intake, intercept, jam and report interactions, cooldowns and debug forcing.
- Added `pneumomail_capsule`, five static pneumomail rumors and one pressure-log contract.
- Routed pneumomail events through existing `systems/events.ts`, `systems/rumor.ts`, `systems/contracts.ts` and `systems/world_log.ts`.
- Added the main interaction hook and debug command.
- Updated `README.md` with shipped pneumomail behavior.

## Verification

- Baseline `npm run typecheck`: failed before edits, missing script.
- `npm run check`: failed after edits, missing script.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
