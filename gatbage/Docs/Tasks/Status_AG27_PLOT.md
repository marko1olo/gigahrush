# AG27 Main Plot Next Chain Status

Agent: AGENT_27_MAIN_PLOT_NEXT_CHAIN
Domain: Main Plot / Story Rooms / Quest Chain
Task count: 8

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_27_MAIN_PLOT_NEXT_CHAIN">` from `Docs/AgentPrompts/AGENT_27_MAIN_PLOT_NEXT_CHAIN.md`.
- [x] Read `README.md` plot sections.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` section 1.6 and late-game notes.
- [x] Read `src/data/plot.ts`.
- [x] Read `src/data/plot_rooms.ts`.
- [x] Read `src/gen/living/yakov_lab.ts`.
- [x] Read `src/gen/maintenance/mancobus_room.ts`.
- [x] Read `src/gen/hell/index.ts`.
- [x] Read `src/gen/void/index.ts`.
- [x] Read `src/systems/quests.ts`.
- [x] Baseline `npm run build` passed before AG27 edits.

## Audit

- Existing chain steps 0-10 are still present and keep the same giver/target order through Olga, Barni, Yakov, Vanka, Major Grom, Mancobus, and Hell arrival.
- Existing referenced plot NPCs have generators: Olga/Barni in tutor room, Yakov in lab, Vanka in den, Major Grom in maintenance forpost.
- Existing referenced plot rooms are present in `PLOT_ROOMS`: `tutor_hall`, `armory`, `yakov_lab`, `vanka_den`, `forpost`.
- The old Hell/Void helper used hardcoded virtual plot indices 11/12; it now follows the Herald kill step in `PLOT_CHAIN` and no longer creates non-data-chain quests.

## Checklist

- [x] Add 5 reachable plot steps after Hell arrival.
- [x] Add 3 plot NPC definitions: Nikanor, Marfa, Jean.
- [x] Add 3 plot room specs: burned contact cell, Herald threshold, Void warning cell.
- [x] Generate Hell plot rooms/NPCs through the Hell content manifest.
- [x] Generate Void warning cell through the Void content manifest.
- [x] Use only existing `QuestType` values.
- [x] Keep rewards useful but bounded: phase/void PSI, stabilizer, supplies, and a handoff trophy.
- [x] Update README shipped facts.
- [x] Attempt `npm run check`.

## Notes

- The separate VISIT-VOID quest was removed during polish because the portal can be entered immediately after the Herald fight; keeping that step could strand the dependency chain.
- The threshold is now the Herald kill step itself: killing three Heralds opens the portal, then the next giver is Жан Пустотник inside Void.
- `npm run check` was attempted multiple times while shared test infrastructure was changing. The last wrapper attempt passed typecheck, unit tests, and build, then the smoke subprocess exited with code `-1` after Chrome startup without a smoke assertion failure. Standalone validation passed: `npm run typecheck`, unit tests in an AG27-specific build, `npm run build`, and `npm run smoke`.
