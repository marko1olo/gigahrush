# LOG AG86 Chernobog Docket

## 2026-05-18

Implemented the Ministry Chernobog archive docket pass.

Changed:
- Added `src/data/chernobog_docket.ts` with six docket item definitions, short note text, event tag helpers, and rumor id helpers.
- Wired docket item definitions into `src/data/items.ts` and note snippets into `src/data/notes.ts`.
- Added `src/gen/ministry/chernobog_archive_docket.ts` with handler NPCs and side quests for submit, forge, sell, hide, liquidator handoff, cult-contact handoff, and Yakov review.
- Added docket documents to the existing Ministry document gate owner container, behind the locked N3 gate, and in liquidator archive filing containers.
- Added evidence-aware container event tags/rumor ids in `src/systems/containers.ts`.
- Added rumor routing for docket item events in `src/systems/rumor.ts`.
- Added static rumors for the docket lead and handling consequences in `src/data/rumors.ts`.
- Added a generic `registerSideQuestSteps()` helper in `src/data/plot.ts` so existing plot NPCs can receive additive side branches without replacing their NPC definition.

Validation:
- Required baseline `npm run typecheck` failed before edits because no `typecheck` script exists.
- Baseline `npx tsc --noEmit` passed before edits.
- Final `npm run typecheck` and `npm run check` both fail because those scripts are missing.
- Final `npx tsc --noEmit` fails on unrelated existing worktree errors; AG86-touched paths do not appear in filtered diagnostics.
- Final `npm run build` fails in unrelated `src/systems/procedural_anomalies.ts` duplicate exports before AG86 modules are reached.
