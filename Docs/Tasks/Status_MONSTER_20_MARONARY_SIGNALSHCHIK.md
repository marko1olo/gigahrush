# MONSTER_20_MARONARY_SIGNALSHCHIK Status

Timestamp: 2026-05-18 14:05:50 BST

## Prompt

- id: `MONSTER_20_MARONARY_SIGNALSHCHIK`
- content id: `maronary_signalshchik`
- ru name: `Маронарный Сигнальщик`
- mode: local Maronary-style green signal aftermath encounter

## Preflight

- Extracted the XML prompt block from `Monster_20.md` by id with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read relevant source:
  - `src/data/samosbor_variants.ts`
  - `src/systems/samosbor.ts`
  - `src/systems/samosbor_director.ts`
  - `src/gen/procedural_screens.ts`
  - `src/entities/eye.ts`
  - `src/entities/spirit.ts`
- Checked VOID content manifest and local VOID content patterns.

## Baseline Validation

Baseline `npm run typecheck` before implementation:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Exit code: 0.

## Implementation

- Added `src/gen/void/maronary_signalshchik.ts`.
- Integrated through `src/gen/void/content_manifest.ts` with one import and one runner call.
- Did not add or edit `SAMOSBOR_VARIANTS`.
- Did not add a permanent global green hazard.
- Did not alter navigation or quest state.

## Gameplay

- Creates `Маронарная диспетчерская` in `VOID` with green Maronary marks, screen source, high-beep cue text, cover props, and a local `EYE` pressure monster named `Маронарный Сигнальщик`.
- Adds a separate `Незеленый обход` room as the clean avoid route.
- Container choices publish local events for heard, followed, disabled, avoided, and cleared phases.
- Follow failure applies short PSI confusion and makes the `EYE` hunt.
- Breaking the source disables local screens, clears the pressure monster, and rewards `bottled_voice`.
- Avoiding the signal rewards `overexposed_photo`.

## Post-Implementation Validation

An initial post-implementation `npm run typecheck` was temporarily blocked by untracked files outside this prompt scope:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit

src/gen/living/plombirovshchik.ts(413,30): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.
src/gen/maintenance/chernaya_lichinka.ts(28,7): error TS6133: 'TAG_WITNESS' is declared but its value is never read.
```

Exit code: 2. The out-of-scope blockers were resolved elsewhere.

Latest `npm run typecheck`:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Exit code: 0.

`npm run check` was also run because the encounter is integrated:

```txt
> gigahrush@1.0.0 check
> npm run typecheck && npm run test:unit && npm run build

> gigahrush@1.0.0 typecheck
> tsc --noEmit

> gigahrush@1.0.0 test:unit
> tsx --test tests/*.test.ts

tests 102
pass 102
fail 0

> gigahrush@1.0.0 build
> vite build

dist/index.html  2,548.88 kB │ gzip: 754.87 kB
```

Exit code: 0.

Targeted VOID generation check:

```txt
{"hasRoom":true,"hasAvoid":true,"hasMonster":true,"containers":4}
```

Exit code: 0.
