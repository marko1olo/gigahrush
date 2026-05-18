# AG88 Istotit Shelter Tally Log

Implemented the shelter tally as an actionable document rather than flavor text.

Files touched:
- `src/data/items.ts`
- `src/data/notes.ts`
- `src/data/container_defs.ts`
- `src/core/types.ts`
- `src/systems/shelter_tally.ts`
- `src/systems/inventory.ts`
- `src/systems/containers.ts`
- `src/main.ts`
- `src/data/rumors.ts`
- `src/systems/rumor.ts`
- `Docs/Tasks/Status_AG88_ISTOTIT_TALLY.md`
- `Docs/AgentLogs/LOG_AG88_ISTOTIT_TALLY.md`

Outcome summary:
- `shelter_tally` can be found through civil-floor containers even when no Istotit aftermath runtime is present.
- The player can submit it, give it to residents, forge it, sell it to cultists/liquidators, hide it, or steal it from protected storage.
- Every handling path publishes `shelter_tally_handled` or the existing theft/deposit event plus the tally outcome event.
- Rumors now expose the social consequence: gratitude, suspicion, debt, hidden-list accusations, and stolen-list accusations.

Validation:
- Baseline `npm run typecheck` failed because no script exists.
- `npm run build` failed on existing duplicate exports in `src/systems/procedural_anomalies.ts`.
- Direct `npx tsc --noEmit --pretty false` failed on existing checkout errors outside the shelter tally symbols; no error referenced `shelter_tally`, `forged_shelter_tally`, or `src/systems/shelter_tally.ts`.
