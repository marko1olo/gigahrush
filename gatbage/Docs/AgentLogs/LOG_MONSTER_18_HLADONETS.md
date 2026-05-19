# LOG_MONSTER_18_HLADONETS

2026-05-18 final report:

- Implemented `hladonets` / `Хладонец` as a MAINTENANCE cold-pocket encounter in `src/gen/maintenance/hladonets.ts`.
- The generated site has a Hladon-prefixed cold machine chamber, frost/fog/residue visuals, a warm steam-offset room, an item trace room, and a named Shadow-based threat.
- Existing `systems/hladon.ts` provides local cold exposure, warm inventory countering, and cold-pocket clearing. The new module observes those room-local Hladon events and publishes Hladonets rumor/event hooks with `monster`, `cold`, `hladon`, and `heat_counter` tags.
- Clearing the Hladon room through the heat/steam control vents the encounter: the named threat loses HP, speed, damage multiplier, and visual scale, then tries to reposition.
- Killing the named threat publishes a local `threat_cleared` Hladonets event and leaves `boiler_water`, `asbestos_cord`, and `valve_tag` traces in the encounter.
- Integrated through `src/gen/maintenance/content_manifest.ts`; that manifest already had unrelated concurrent edits, so the Hladonets ownership in it is only the `generateHladonets` import and runner call.
- Added `tests/monster_18_hladonets.test.ts`.

Validation:

- Baseline `npm run typecheck` before edits: exit 0.
- Final `npm run typecheck`: exit 0.
- `npx tsx --test tests/monster_18_hladonets.test.ts`: exit 0, 1 pass.
- Targeted TypeScript compile for `src/gen/maintenance/hladonets.ts` and `tests/monster_18_hladonets.test.ts`: exit 0.
- `npm run build`: exit 0.
- `npm run check`: exit 1 due unrelated `tests/monster_19_seryy_smotritel.test.ts` failures (`2 !== 1` at lines 64 and 84). The Monster 18 test passed in that run.
