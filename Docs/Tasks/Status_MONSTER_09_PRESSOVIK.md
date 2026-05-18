# Status MONSTER_09_PRESSOVIK

## Preflight

- Extracted `MONSTER_09_PRESSOVIK` XML with:
  `perl -0ne 'print $1 if /(<AGENT_PROMPT id="MONSTER_09_PRESSOVIK">.*?<\\/AGENT_PROMPT>)/s' Monster_09.md`
- Read: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `AGENTS.md`.
- Read relevant source: `src/gen/maintenance/concentrate_press.ts`, `src/gen/design_floors/production_belt.ts`, `src/gen/maintenance/automation_cage.ts`, `src/render/marks.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck` before edits:
  - Exit 0.
  - Output:
    ```txt
    > gigahrush@1.0.0 typecheck
    > tsc --noEmit
    ```

## Implementation

- Added `src/gen/maintenance/pressovik.ts`.
- Integrated through `src/gen/maintenance/content_manifest.ts`.
- Added `tests/monster_09_pressovik.test.ts`.
- Pressovik is a room-rule encounter, not a new `MonsterKind`:
  - stable entry, press line, service bypass, output cassette;
  - visible red danger plates, white safe lanes, lamps and screens;
  - bounded `cell_hazards` registration for unsafe press lanes;
  - stop quest and stop-container deposit path that clears the press hazards;
  - output container crossing event;
  - existing monsters provide pressure while the machine rule carries the encounter.

## Validation

- `npx tsx --test tests/monster_09_pressovik.test.ts`
  - Exit 0.
  - 2 tests passed.
- Final `npm run typecheck`
  - Exit 0.
  - Output:
    ```txt
    > gigahrush@1.0.0 typecheck
    > tsc --noEmit
    ```
- `npm run check`
  - Exit 0.
  - Typecheck passed.
  - Unit tests passed:
    ```txt
    tests 102
    pass 102
    ```
  - Build passed:
    ```txt
    ✓ 334 modules transformed.
    dist/index.html  2,548.88 kB │ gzip: 754.87 kB
    ✓ built in 2.63s
    ```
