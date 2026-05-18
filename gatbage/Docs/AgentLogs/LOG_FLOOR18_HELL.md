# LOG FLOOR18_HELL

## 2026-05-18

Implemented `FLOOR18_HELL` as a bounded additive Hell encounter.

- Added `src/gen/hell/choir_tax.ts`.
- Added one manifest runner entry in `src/gen/hell/content_manifest.ts`.
- Created a high-threat PSI/cult room with finite enemies, finite cache rewards, three quest NPCs, and meat choir trace notes.
- Added side quests for altar/signal break, cult tax, PSI cache handoff, and last-liquidator extraction.
- Added tagged Hell outcome publication through the existing world-event store.

Caps recorded:

- Monsters: 8.
- Cultist guards: 3.
- Quest NPCs: 3.
- Cache reward claim: 1.
- Side quest reward claims: 4, one per registered side quest.

Validation:

- Baseline `npm run build`: passed before edits.
- Final `npm run check`: passed.
