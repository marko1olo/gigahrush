# AG76 Chernobog Faction Data Log

## 2026-05-18 02:11 BST

- Extracted `AGENT_76_CHERNOBOG_FACTION_DATA_PASS` from `Docs/AgentPrompts/AGENT_76_CHERNOBOG_FACTION_DATA_PASS.md`.
- Read required project docs and source files: `README.md`, `architecture.md`, `desdoc.md` sections 16.2 and 17-19, faction event data/system files, rumor data, relations data, and event store.
- Baseline `npm run typecheck` was blocked before edits because this checkout's `package.json` only exposes `dev`, `build`, and `preview`.
- Added data-only Chernobog faction event ids for recruitment, black-hand marks, external supply, cult procession tagging, liquidator clash evidence, and archive evidence.
- Added static rumors that frame the cult as a social infection inside ordinary rooms rather than a single monster faction.
- Extended `tests/data-ids.test.ts` so faction event ids are unique and referenced items, weapons, resource deltas, group bounds, and duplicate tags are checked.
- Validation:
  - `npm run typecheck`: blocked, missing script.
  - `npm run test:unit`: blocked, missing script.
  - `npx tsc -p tsconfig.json --noEmit`: passed.
  - `npx tsc -p tsconfig.test.json --outDir /tmp/gigahrush-ag76-test-build`: passed.
  - `node --test /tmp/gigahrush-ag76-test-build/tests/data-ids.test.js`: passed, 6 tests.
  - `npm run build`: passed.
- Final rerun after observing concurrent/unowned workspace changes:
  - `npx tsc -p tsconfig.json --noEmit`: blocked by unrelated strict TypeScript errors, including duplicate `eventTags` in `src/data/plot.ts` and unused symbols in maintenance, HUD, faction event, inventory, quest, and samosbor files.
  - `npx tsc -p tsconfig.test.json --outDir /tmp/gigahrush-ag76-test-build-final`: blocked by the same errors before the AG76 data-id test could be emitted.
