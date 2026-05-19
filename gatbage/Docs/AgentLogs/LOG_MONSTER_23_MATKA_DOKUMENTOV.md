# LOG MONSTER_23_MATKA_DOKUMENTOV

Final report, 2026-05-18.

Implemented `matka_dokumentov` / `Матка Документов` as a self-contained Ministry room puzzle in `src/gen/ministry/matka_dokumentov.ts`, integrated through the Ministry content manifest. The encounter uses a central document anchor plus containers for decoy blank forms, wrong-stack burning, cancellation form, two breathing cabinets, and the unsigned-order core.

Runtime behavior is bounded and local:
- no edits to generic `MATKA` reproduction;
- only `PARAGRAPH` / `PECHATEED` local paper threats;
- max 5 active threats and max 5 total spawned by the room;
- repeated pressure beyond the cap can only apply two bounded empowerments;
- room facts publish through `systems/events.ts` via local observer events.

Player solutions:
- burn the wrong stack by taking fuel before reading it;
- use decoy blank forms to soften later pressure;
- close both cabinets to cancel the anchor;
- take the cancellation form to clear active paper threats;
- rush the core to stop further spawns while leaving current threats alive.

Validation:
- Baseline `npm run typecheck`: passed before implementation.
- `npx tsx --test tests/monster_23_matka_dokumentov.test.ts`: passed.
- Final `npm run check`: passed, including 102 unit tests and production build.

Intermediate notes:
- Reduced room footprint after an early full-generator run logged unreliable placement for the larger room.
- Fixed one strict TypeScript unused-local error after that placement change.
- Observed one unrelated flaky full-suite failure in `monster_16_ekrannik`; the focused test passed by itself and the final full check passed.
