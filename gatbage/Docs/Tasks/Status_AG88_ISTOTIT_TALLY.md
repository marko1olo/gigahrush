# AG88 Istotit Shelter Tally Status

Current state: implemented; validation blocked by existing checkout issues.

## Preflight

- Extracted prompt block: `AGENT_88_ISTOTIT_SHELTER_TALLY`.
- Read required docs: `README.md`, `architecture.md`, `istotit.md`, `desdoc.md` sections 16.3 and 17.
- Read required source: `src/data/notes.ts`, `src/systems/containers.ts`, `src/data/plot.ts`, `src/systems/events.ts`, `src/systems/rumor.ts`.
- Baseline `npm run typecheck`: failed because this checkout has no `typecheck` script. `npm run` lists only `dev`, `build`, and `preview`.

## Implementation

- Added document items:
  - `shelter_tally`: real post-Istotit ведомость.
  - `forged_shelter_tally`: local forged variant.
- Added short bureaucratic note text for the tally pressure.
- Added a static container path on civil floors through `ensureShelterTallyStaticPath`, so the tally does not depend on AG87 runtime.
- Added organic chance in owner/paper/trade containers for theft/recovery pressure.
- Added `systems/shelter_tally.ts` as the small outcome publisher for:
  - submit original to Ministry;
  - submit forged copy to Ministry;
  - give original to residents;
  - give forged copy to residents;
  - forge with `forged_stamp_sheet`;
  - sell to cultists;
  - sell to liquidators;
  - hide in trash/secret stash;
  - steal from a protected container.
- Added `shelter_tally_handled` world event type and rumor mapping through `data.rumorIds`.
- Added rumor consequences for gratitude, suspicion, debt, hidden-list accusations, and theft accusations.

## Validation

- `npm run typecheck`: blocked, missing script.
- `npm run build`: failed before AG88 modules on duplicate exports in `src/systems/procedural_anomalies.ts`.
- `npx tsc --noEmit --pretty false`: failed with pre-existing checkout issues, including duplicate `govnyak_roll`, `procedural_anomalies` duplicate exports, unresolved `target`/`transitionTags`/`anomalyData` in `main.ts`, an unused `removeStatus`, and missing `MonsterKind` keys in `rpg.ts`.

No reported error referenced `shelter_tally`, `forged_shelter_tally`, or `src/systems/shelter_tally.ts`.
