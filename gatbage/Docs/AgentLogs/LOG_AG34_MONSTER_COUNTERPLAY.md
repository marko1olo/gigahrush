# AG34 Monster Counterplay Log

Date: 2026-05-17

## Final Report

- Created `Docs/Tasks/Status_AG34_MONSTER_COUNTERPLAY.md` with the required 22-monster checklist.
- Tightened vague counterplay lines in `src/data/monster_ecology.ts` so each one gives a playable instruction.
- Aligned `silent_polzun` variant floors with Polzun ecology by removing the unsupported Ministry floor.
- Expanded Nightmare and Shadow ecology rumor floor coverage so their rumor warnings cover every ecology spawn floor.
- Added `tests/content-registry.test.ts` coverage for the monster ecology contract:
  - every `MONSTERS` registry entry has ecology;
  - ecology entries are unique and have floors, rooms, counterplay, loot hints, and rumor ids;
  - ecology rumor ids resolve to monster rumors for the same monster and cover every ecology floor;
  - ecology variant ids resolve, match the same base monster, and stay inside ecology floors;
  - rare drops resolve to known item ids with valid chance/count values.

## Validation

- Baseline `npm run typecheck`: passed.
- Post-edit `npm run typecheck`: passed.
- `npm run test:unit`: ran. The new monster ecology test passed. The full suite failed in existing `tests/inventory-rpg.test.ts` because current dirty `src/data/psi.ts` sets `psi_rupture` cost to 5, while the test expects label `ПСИ 1/10 -3`.

No runtime AI, generator, enum, or floor behavior was changed.
