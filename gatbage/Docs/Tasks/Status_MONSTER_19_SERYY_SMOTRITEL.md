# Status MONSTER_19_SERYY_SMOTRITEL

Task: implement `seryy_smotritel` / Серый Смотритель as a local Void no-look encounter around seroburmaline residue.

Preflight:
- XML block extracted from `Monster_19.md` with `perl -0ne 'print "$1\n" if /(<AGENT_PROMPT id="MONSTER_19_SERYY_SMOTRITEL">.*?<\/AGENT_PROMPT>)/s' Monster_19.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, and all source files listed in the prompt.
- Baseline `npm run typecheck`: exit 0.

Implementation:
- Added `src/gen/void/seryy_smotritel.ts`.
- Integrated through `src/gen/void/content_manifest.ts`.
- Added `tests/monster_19_seryy_smotritel.test.ts`.

Design notes:
- The encounter is a local Void chamber, not a global monster framework.
- No renderer gaze checks were added.
- The rule is resolved on bounded container interactions using room geometry, cover, explicit notes, route marks, and a single interaction-time line/angle check.
- Events use tags `monster`, `seroburmaline`, `no_look`, `psi`, and `seryy_smotritel`.

Validation:
- Focused test `npx tsx --test tests/monster_19_seryy_smotritel.test.ts`: exit 0.
- `npm run check`: exit 0 (`typecheck`, 98 unit tests, `vite build`).
