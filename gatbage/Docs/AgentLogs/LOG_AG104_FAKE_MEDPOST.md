# LOG AG104 Fake Medpost Zhelemish

## 2026-05-18

Implemented `AGENT_104_FAKE_MEDPOST_ZHELEMISH`.

Files changed:

- `src/gen/living/fake_medpost_zhelemish.ts`
- `src/gen/living/content_manifest.ts`
- `Docs/Tasks/Status_AG104_FAKE_MEDPOST.md`
- `Docs/AgentLogs/LOG_AG104_FAKE_MEDPOST.md`

Summary:

- Added `Липовый медугол желемыша`, a protected Living medical-fraud POI in zone HUD 46.
- Added practitioner, patient, relative and stock-runner NPCs.
- Added decision routes to warn the patient, report to the Ministry, buy counterfeit treatment, take a profit cut, or steal stock.
- Seeded suspicious zhelemish stock through existing item/container patterns without adding a medicine framework.
- Added tagged local event outcomes for fraud exposed, patient saved, patient harmed and profit taken.
- Let stock theft publish through the existing `item_stolen` container event path.

Validation:

- Baseline `npm run typecheck`: unavailable; `package.json` has no script.
- `npm run check`: unavailable; `package.json` has no script.
- `npm run smoke`: unavailable; `package.json` has no script.
- `npx tsc --noEmit`: failed on existing repo-wide errors unrelated to AG104; no AG104 diagnostics.
- `npm run build`: passed, with the pre-existing duplicate-case warning in `src/systems/debug.ts`.

