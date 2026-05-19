# Status MONSTER_23_MATKA_DOKUMENTOV

Task: implement `matka_dokumentov` / Матка Документов as a local Ministry boss room puzzle.

Preflight:
- Extracted `MONSTER_23_MATKA_DOKUMENTOV` XML block from `Monster_23.md` with CLI.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `stamp_room.ts`, `permit_office.ts`, `refusal_clause.ts`, `paragraph.ts`, `pechateed.ts`, `systems/events.ts`.

Baseline:
- `npm run typecheck`: passed.

Exact baseline output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Implementation status:
- Added `src/gen/ministry/matka_dokumentov.ts`.
- Integrated the room through `src/gen/ministry/content_manifest.ts`.
- Added `tests/monster_23_matka_dokumentov.test.ts`.

Gameplay:
- Generates a local Ministry office boss room, `Матка Документов: стол размножения`.
- Central paper anchor is not a `MonsterKind.MATKA`, so generic Matka reproduction is untouched.
- Paper pressure uses capped local `PARAGRAPH` / `PECHATEED` spawns: max 5 active and max 5 total spawned by this room.
- Counterplay paths: decoy blank forms, burn the wrong stack with fuel, close two breathing cabinets, take the cancellation form, or rush the core for the unsigned order.
- Failure path: reading the wrong stack before burning it publishes a document delay event and reduces Ministry document stock.
- Reward/trace: `unsigned_order`, `blank_form`, and `psi_order_seal` through room reward/drop or the follow-up side quest.

Validation:
- `npx tsx --test tests/monster_23_matka_dokumentov.test.ts`: passed.
- `npm run check`: passed after fixes.

Final `npm run check` result:

```txt
> gigahrush@1.0.0 check
> npm run typecheck && npm run test:unit && npm run build

tests 102
pass 102
fail 0

✓ built in 2.34s
```

Notes:
- An intermediate `npm run check` caught `TS6133` for an unused local after reducing room size; fixed.
- One intermediate full-suite run hit existing `monster_16_ekrannik` random placement flakiness (`2 !== 3` screen cells). The Ekrannik test passed by itself, and the final full `npm run check` passed.
