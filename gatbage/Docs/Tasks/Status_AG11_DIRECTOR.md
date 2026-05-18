# AGENT_11_SAMOSBOR_DIRECTOR_BEATS Status

Domain: Samosbor Director / Beat Scheduling

## Preflight

- [x] XML prompt extracted by id `AGENT_11_SAMOSBOR_DIRECTOR_BEATS`.
- [x] Read `README.md`, `architecture.md`, expansion design, implementation plan, integration contract, samosbor variants, samosbor system, event store, and floor manifest.
- [x] Baseline `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 739.88 kB, built in 780 ms.

## Tasks

- [x] Add `SamosborBeatDef` and registration API in `src/data/samosbor_director.ts`.
- [x] Add 10 baseline beats across warning, active, and aftermath phases.
- [x] Add optional normalized director state on `GameState` with cooldowns, per-cycle run counts, force cursor, and 300-entry trace ring.
- [x] Add scheduler/effect runtime in `src/systems/samosbor_director.ts`.
- [x] Hook director to samosbor start, 12-second active cadence, and post-rebuild aftermath.
- [x] Publish chosen beats through `systems/events.ts` using existing event types and `samosbor`/`director` tags.
- [x] Add debug inspection, force-next-beat, and cooldown-clear commands.
- [x] Update README with shipped behavior only.

## Verification

- [x] `npm run typecheck`: PASS after removing a pre-existing duplicate helper block in `src/systems/rumor.ts`.
- [x] `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 999.77 kB, built in 935 ms.
- [x] `npm run check`: PASS, 25 unit tests, build 1.16 s, smoke playability passed at `http://127.0.0.1:64192/`.
- [x] `git diff --check`: PASS.
