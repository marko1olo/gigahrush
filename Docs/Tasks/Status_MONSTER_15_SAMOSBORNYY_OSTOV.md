# Status_MONSTER_15_SAMOSBORNYY_OSTOV

Prompt: `MONSTER_15_SAMOSBORNYY_OSTOV`

## Preflight

- Extracted the XML prompt block from `Monster_15.md` by CLI.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source files:
  - `src/gen/living/hospital_quarantine.ts`
  - `src/gen/design_floors/registry_morgue.ts`
  - `src/gen/carnivorous_fungus_room.ts`
  - `src/entities/zombie.ts`
  - `src/entities/shadow.ts`
  - `src/systems/events.ts`

## Baseline

Baseline command:

```txt
npm run typecheck
```

Exact output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Result: exit 0, no diagnostics.

## Implementation

- Added `src/gen/living/samosbornyy_ostov.ts`.
- Integrated it through `src/gen/living/content_manifest.ts`.
- Added a focused test at `tests/monster_15_samosbornyy_ostov.test.ts`.

Gameplay surface:

- Local LIVING zone 64 aftermath medical/morgue scene.
- Visible warning note before risky loot.
- Safe inspected supply container before the sealed corpse bay.
- Hermetic corpse bay with one local `ZOMBIE` named `Самосборный Остов`.
- Too-clean corpse container tagged `samosbornyy_ostov`, `disturbed`, `monster`, `corpse`, `loot_risk`, `aftermath`.
- Safe report and burn paths through liquidator side quests.
- Burn/disposal deposit path through a tagged public brazier container.

## Validation

- Focused test passed:

```txt
npx tsx --test tests/monster_15_samosbornyy_ostov.test.ts
```

- Post-change typecheck passed:

```txt
npm run typecheck
```

Exact output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Result: exit 0, no diagnostics.

- Integrated validation passed:

```txt
npm run check
```

Result: exit 0. Unit tests: 100 passed. Build completed, producing `dist/index.html`.
