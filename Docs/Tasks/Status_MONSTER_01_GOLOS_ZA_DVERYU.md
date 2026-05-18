# Status_MONSTER_01_GOLOS_ZA_DVERYU

Date: 2026-05-18

## Scope

- Implemented `golos_za_dveryu` / `Голос За Дверью` as a Living threshold encounter.
- Source file: `src/gen/living/golos_za_dveryu.ts`.
- Integration line: `import './golos_za_dveryu';` in `src/gen/living/content_manifest.ts`.
- Focused test: `tests/monster_01_golos_za_dveryu.test.ts`.

## Preflight

- Extracted the `MONSTER_01_GOLOS_ZA_DVERYU` XML block from `Monster_01.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source files:
  - `src/gen/living/external_cell_neighbor.ts`
  - `src/gen/kvartiry/false_neighbor.ts`
  - `src/gen/living/hermoseam_station.ts`
  - `src/entities/monster.ts`
  - `src/data/monster_ecology.ts`
  - `src/systems/events.ts`

## Baseline Validation

Command: `npm run typecheck`

Result: exit code 0.

Output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Implementation Notes

- The POI generates a marked front threshold room and a sealed apartment behind a hermetic-closed door.
- The encounter contains one bounded `MonsterKind.NELYUD` named `Голос За Дверью`; no new `MonsterKind` was added.
- Proximity alone does not punish the player. The threat is held behind the door, and the warning cues are visible through marks, residue, room layout, NPC lines, and quest text.
- Noncombat outcomes are exposed through local NPC quests: mark, repair, and report/leave for liquidators.
- The combat path is explicit: open deliberately, clear one NELYUD, then recover the trace.
- Outcome events use existing event types with tags `monster`, `door_lure`, and `samosbor_aftermath`.

## Current Validation

- `npm run typecheck`: passed, exit code 0.
- `npx tsx --test tests/monster_01_golos_za_dveryu.test.ts`: passed, 2/2 tests.
- `npm run check`: passed, exit code 0.
  - `tsc --noEmit`: passed.
  - `tsx --test tests/*.test.ts`: passed, 101/101 tests.
  - `vite build`: passed; `dist/index.html` built at 2,548.88 kB, gzip 754.87 kB.
