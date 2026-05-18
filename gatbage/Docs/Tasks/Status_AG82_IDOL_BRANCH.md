# Status AG82 Idol Branch Expansion

Prompt: `Docs/AgentPrompts/AGENT_82_IDOL_BRANCH_EXPANSION.md`

## Preflight

- Read: `README.md` story chain.
- Read: `architecture.md`.
- Read: `desdoc.md` section 16.2.
- Read: `src/data/plot.ts`.
- Read: `src/systems/quests.ts`.
- Read: `src/gen/living/yakov_lab.ts`.
- Read: `src/gen/hell/plot_chain.ts`.
- Read: `src/systems/events.ts`.
- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.

## Implementation Status

- Added gated idol side branches for Ministry reporting, liquidator field reporting, candle concealment, counterfeit decoy work and cult-contact handoff.
- Branches that inspect or hand off `idol_chernobog` return `idol_chernobog` as the reward, preserving Yakov's required item.
- The counterfeit branch uses `forged_stamp_sheet` and marks the main idol as preserved.
- Added authored quest event metadata so side branches publish tagged `quest_created` / `quest_completed` events with branch data and rumor ids.
- Added static rumor hooks for the new branch outcomes.
- Added tests for branch registry continuity and event completion behavior.

## Validation

- `npx tsc --noEmit`: failed on pre-existing unrelated worktree errors, including `SILVER_SLIME_SEALED_ID`, missing `MonsterKind.KOSTOREZ` registry entries, duplicate debug imports, incomplete faction clash helpers and incomplete samosbor Istotit symbols.
- `npx tsc -p tsconfig.test.json`: failed on the same pre-existing errors plus missing `uvBeamFx` / `uvBeamLen` defaults in `tests/helpers.ts`.
- `node --test .test-build/tests/content-registry.test.js .test-build/tests/events-economy.test.js`: blocked at module load by pre-existing `ReferenceError: SILVER_SLIME_SEALED_ID is not defined` in `.test-build/src/data/contracts.js`.
- `npm run build`: passed. Vite emitted `dist/index.html`.
- Required `npm run check`: failed because `package.json` has no `check` script.
