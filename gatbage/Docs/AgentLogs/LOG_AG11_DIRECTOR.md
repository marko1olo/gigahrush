# AGENT_11_SAMOSBOR_DIRECTOR_BEATS Log

## 2026-05-17 Director Beats MVP

What was done:
- Added `src/data/samosbor_director.ts` with `SamosborBeatDef`, registry functions, and 10 baseline beats.
- Added `src/systems/samosbor_director.ts` with optional director state, 300-entry trace ring, weighted selection, cooldowns, run limits, debug force, and cheap effect application.
- Wired samosbor to call the director before start, on a 12-second active cadence, and after post-samosbor rebuild aftermath.
- Added debug commands for director state, force next beat, and cooldown clear.
- Updated README with factual director behavior.

Visible consequences:
- Warning lines.
- Local fog residue.
- Small liquidator patrol.
- Resource shortage through economy stock.
- Rumor seeding through NPC memory.
- Door malfunction.
- Container theft.
- One monster aftershock.

Verification:
- Baseline `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 739.88 kB, built in 780 ms.
- `npm run typecheck`: PASS after removing a pre-existing duplicate helper block in `src/systems/rumor.ts`.
- `npm run build`: PASS, Vite 7.2.4, 201 modules, `dist/index.html` 999.77 kB, built in 935 ms.
- `npm run check`: PASS, 25 unit tests, Vite build 1.16 s, smoke playability passed at `http://127.0.0.1:64192/`.
- `git diff --check`: PASS.

Known constraints:
- Director state is runtime-only and optional; it is not persisted in saves.
- Debug force uses the current phase: warning when inactive, active while samosbor is active, aftermath from the post-rebuild hook.
