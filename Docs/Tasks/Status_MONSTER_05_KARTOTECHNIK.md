# Status MONSTER_05_KARTOTECHNIK

Date: 2026-05-18
Owner: Ministry document-objective harassment

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_05_KARTOTECHNIK">` from `Monster_05.md` with `perl`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `inspection_archive.ts`, `document_gate.ts`, `admin_common.ts`, `pechateed.ts`, `paragraph.ts`, `systems/events.ts`.
- Baseline before edits: `npm run typecheck` exited 0.

Exact baseline output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Implemented

- Added `src/gen/ministry/kartotechnik.ts`.
- Wired it through `src/gen/ministry/content_manifest.ts`.
- Added a bounded Ministry office POI: `Картотека невозможного алфавита`.
- Added local objective pressure around the module-owned `missing_record_file`.
- Added `PECHATEED` and `PARAGRAPH` threats inside the archive setup.
- Added counterplay paths:
  - decoy `blank_form` quest gives a key for the middle drawer-bank shortcut;
  - burned wrong-index trace via `record_exposure_notice`;
  - direct recovery from the relocated cabinet remains possible as theft.
- Added local event observer for quest outcomes:
  - `relocated`;
  - `recovered`;
  - `protected`;
  - `burned`;
  - `delayed`.
- Event/container tags include `monster`, `documents`, `archive`, `kartotechnik`, `relocated_objective`.

## Softlock Check

- The relocated objective is in a discovered owner container, not a locked container; player can take it as theft.
- The drawer bank has two unlocked closed side doors and one locked shortcut, so the rear archive stays reachable without the decoy key.
- The timed recovery quest can fail, but the item remains in the local container after the deadline.
- No global plot target is moved or consumed by this module.

## Validation

- `npm run typecheck` after implementation exited 2 because of unrelated untracked files:
  - `src/gen/living/golos_za_dveryu.ts(72,5): 'weapon' does not exist in type 'PlotNpcDef'`.
- `npx tsc --noEmit --pretty false --incremental false` also reported unrelated untracked files:
  - `src/gen/living/plombirovshchik.ts(331,62): 'reason' is declared but never read`.
  - `src/gen/living/plombirovshchik.ts(413,30): number | undefined passed to number`.
- `npm run check` exited 2 during typecheck because of unrelated untracked file:
  - `src/gen/maintenance/chernaya_lichinka.ts(28,7): 'TAG_WITNESS' is declared but never read`.
- `npm run test:unit` ran; 92 passed, 3 failed in unrelated untracked tests:
  - `tests/monster_13_belaya_prislushka.test.ts`;
  - `tests/monster_19_seryy_smotritel.test.ts`.
- `npm run build` exited 0; Vite compiled the game import graph including `kartotechnik.ts`.
- `git diff --check` on owned files exited 0.

The new Ministry module was imported by the unit suite through `src/gen/ministry/content_manifest.ts`; no failure referenced `kartotechnik.ts`.
