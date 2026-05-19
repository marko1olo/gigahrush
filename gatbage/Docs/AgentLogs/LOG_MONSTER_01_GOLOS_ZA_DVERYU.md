# LOG_MONSTER_01_GOLOS_ZA_DVERYU

Date: 2026-05-18

Implemented `golos_za_dveryu` / `Голос За Дверью` as a bounded Living-floor threshold encounter.

Changed files:

- `src/gen/living/golos_za_dveryu.ts`
- `src/gen/living/content_manifest.ts` with `import './golos_za_dveryu';`
- `tests/monster_01_golos_za_dveryu.test.ts`
- `Docs/Tasks/Status_MONSTER_01_GOLOS_ZA_DVERYU.md`
- `Docs/AgentLogs/LOG_MONSTER_01_GOLOS_ZA_DVERYU.md`

Implementation summary:

- Added a marked two-room POI: `Порог знакомого голоса` and `Квартира за голосом`.
- The lure door starts `HERMETIC_CLOSED`; the only threat is one existing `MonsterKind.NELYUD` named `Голос За Дверью` behind that threshold.
- Added visible and textual warnings: wrong familiar voice, door/threshold marks, raw-meat residue, NPC warnings, and clue items.
- Added noncombat choices through side quests: mark the door, repair the seal, or report/leave it for liquidators.
- Added explicit combat choice through a kill quest that tells the player to open deliberately, fall back, and clear one NELYUD.
- Added outcome events using existing event types and tags `monster`, `door_lure`, and `samosbor_aftermath`.
- Kept broad runtime, AI, core, renderer, and monster registry files unchanged.

Validation:

- Baseline `npm run typecheck`: passed before implementation.
- Final `npm run typecheck`: passed.
- Focused `npx tsx --test tests/monster_01_golos_za_dveryu.test.ts`: passed, 2/2 tests.
- Final `npm run check`: passed; 101/101 unit tests passed and Vite build completed.
