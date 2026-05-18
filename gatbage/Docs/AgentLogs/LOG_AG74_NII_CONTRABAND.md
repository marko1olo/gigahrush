# AG74 NII Contraband Audit Log

## 2026-05-18

- Extracted `AGENT_74_NII_CONTRABAND_AUDIT` from `Docs/AgentPrompts/AGENT_74_NII_CONTRABAND_AUDIT.md`.
- Added `src/gen/ministry/nii_contraband_audit.ts`.
- Registered the Ministry content module in `src/gen/ministry/content_manifest.ts`.
- Added AG74 NII audit documents to `src/data/items.ts`:
  - `nii_contraband_manifest`
  - `nii_market_receipt`
  - `nii_forged_audit`
- Added `nii_sample_audit` faction-event data in `src/data/faction_events.ts`.
- POI behavior:
  - reachable Ministry office/archive with an internal locked evidence cage;
  - a runner near the Ministry spawn gives a VISIT quest pointing the map/quest path to the room;
  - owner/faction containers tagged `nii`, `sample`, `contraband`, `ministry`;
  - evidence theft flows through existing container `item_stolen` events and audit/witness handling;
  - three outcomes: expose to liquidators, sell a silver sample to a wild broker, or conceal through a forged NII audit act;
  - side-quest completion observer publishes bounded `faction_relation_changed` events and adjusts reputation.
- Validation:
  - Baseline `npm run typecheck`: blocked, no `typecheck` script in `package.json`.
  - Baseline substitute `npx tsc --noEmit`: passed before implementation.
  - Final `npx tsc --noEmit`: blocked by unrelated existing work-in-progress errors outside AG74.
  - Final `npm run build`: blocked by unrelated missing procedural-anomaly export in `src/main.ts`; Vite also warns about a duplicate `maronary_shaving` case in `src/systems/rumor.ts`.
  - Final `npm run check`: blocked, no `check` script in `package.json`.
