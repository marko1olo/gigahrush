# Status AG86 Chernobog Docket

## Prompt

- Extracted `AGENT_86_CHERNOBOG_ARCHIVE_DOCKET` from `Docs/AgentPrompts/AGENT_86_CHERNOBOG_ARCHIVE_DOCKET.md`.
- Read required context: `README.md`, `architecture.md`, `desdoc.md` section 16.2, `src/data/notes.ts`, `src/gen/ministry/document_gate.ts`, `src/gen/ministry/inspection_archive.ts`, `src/gen/ministry/liquidator_archive.ts`, `src/systems/containers.ts`.

## Baseline

- `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.
- `npx tsc --noEmit`: passed before edits.

## Implementation

- Added six short docket documents for central/external Chernobog-cell evidence.
- Added docket note snippets to the general note pool.
- Put docket items behind the existing Ministry document gate and liquidator archive containers.
- Added Ministry handler NPCs for submit, forge, sell, hide, liquidator, and cult-contact choices.
- Added a Yakov side branch for showing the redacted central note after the early Yakov plot step.
- Added evidence tags and rumor routing for docket theft/open/quest events.

## Validation

- `npm run typecheck`: failed; script is missing from `package.json`.
- `npm run check`: failed; script is missing from `package.json`.
- `npx tsc --noEmit`: passed before edits; after edits it fails on unrelated existing worktree errors in `src/main.ts`, `src/systems/faction_events.ts`, `src/systems/contracts.ts`, `src/gen/maintenance/pneumomail_station.ts`, and related files. Filtering the diagnostics for AG86-touched paths returned no matches.
- `npm run build`: failed before reaching AG86 modules because `src/systems/procedural_anomalies.ts` has duplicate exported declarations for `proceduralAnomalyEventTags` and `proceduralAnomalyEventData`.
