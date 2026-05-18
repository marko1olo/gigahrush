# AG98 Govnyak Courier Status

## Preflight

- Prompt XML block extracted: `AGENT_98_GOVNYAK_COURIER_CONTRACT`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.4.
- Read required files: `src/data/contracts.ts`, `src/systems/contracts.ts`, `src/systems/quests.ts`, `src/systems/factions.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: blocked, package has no `typecheck` script.

## Implementation

- [x] Add sealed govnyak courier package item and three endpoint contract definitions.
- [x] Add bounded debug creation path that gives one package and creates deliver/confiscate/switch routes.
- [x] Resolve route choices mutually exclusively and publish delivery/confiscation/switch/failure/opened-package facts through existing event types.
- [x] Cap rewards and prevent repeated package farming.
- [x] Run final validation.
- [x] Append final report to `Docs/AgentLogs/LOG_AG98_GOVNYAK_COURIER.md`.

## Notes

- Event type ids are a closed core union, so AG98 will publish outcome facts through existing `contract_completed`, `contract_failed`, and `player_use_item` event types with courier/outcome tags rather than adding core event types.
- `npx tsc --noEmit --pretty false`: blocked by existing errors outside AG98: `src/gen/maintenance/pneumomail_station.ts(45,54)` argument count mismatch and `src/systems/govnyak.ts(105,10)` unused `removeStatus`.
- Focused touched-file typecheck filter: no AG98 file errors after removing a duplicate stale `govnyak_roll` item row that conflicted with the richer AG96 definition.
- `node scripts/content-audit.mjs`: passed, errors none.
- `npm run build`: passed.
- `npm run check`, `npm run test:unit`, `npm run smoke`: blocked, scripts are missing from the active `package.json`.
