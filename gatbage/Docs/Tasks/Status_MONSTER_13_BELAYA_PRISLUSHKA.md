# Status MONSTER_13_BELAYA_PRISLUSHKA

## Preflight

- XML block extracted by id from `Monster_13.md` with `awk`.
- Read: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `AGENTS.md`.
- Read relevant source: `src/gen/living/white_compulsion_room.ts`, `src/gen/living/hospital_quarantine.ts`, `src/data/slime_defs.ts`, `src/systems/status.ts`, `src/systems/events.ts`, `src/systems/ai/npc_fsm.ts`.
- Baseline `npm run typecheck`: exit 0.

Baseline output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Implementation

- Added `src/gen/living/belaya_prislushka.ts`.
- Integrated through `src/gen/living/content_manifest.ts`.
- Added `tests/monster_13_belaya_prislushka.test.ts`.

## Gameplay

- New LIVING zone POI: `belaya_prislushka` / `Белая Прислушка`.
- One at-risk NPC slowly walks toward a closed source-room door with visible white residue cues.
- Rescue path: timed TALK quest saves the witness without killing or sealing the source.
- Source-clear path: `sealant_tube` handoff publishes a source-cleared outcome.
- Risky sample path: `slime_sample_white` fetch quest spawns a monster through the existing quest pressure hook.
- Loss path: a receipt branch writes off the witness, applies negative relation, and also triggers monster pressure.
- Outcome events are published for rescued, lost, sampled, and source-cleared states with `monster`, `slime_white`, `compulsion`, and outcome tags.

## Validation

- `npx tsx --test tests/monster_13_belaya_prislushka.test.ts`: exit 0, 2 tests passed.
- `npm run check`: exit 0.

Final check summary:

```txt
tests 102
pass 102
vite build: 334 modules transformed
dist/index.html 2,548.88 kB gzip: 754.87 kB
```
