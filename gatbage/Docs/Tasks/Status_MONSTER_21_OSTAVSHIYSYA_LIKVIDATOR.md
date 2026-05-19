# Status: MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR

Task: implement `ostavshiysya_likvidator` / Оставшийся Ликвидатор as a post-cleanup armed human-like encounter with non-kill outcomes.

Preflight:
- Extracted `AGENT_PROMPT id="MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR"` from `Monster_21.md` with `perl -0ne`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, and the listed source files.
- Baseline `npm run typecheck`: exit 0.

Implementation notes:
- Added `src/gen/maintenance/ostavshiysya_likvidator.ts`.
- Integrated through `src/gen/maintenance/content_manifest.ts`.
- Uses NPCs, side quests, containers, cover geometry, and `systems/events.ts`; no new `MonsterKind` or faction system.

Validation:
- `npm run typecheck`: exit 0 after clearing strict-TS blockers exposed in adjacent in-progress monster modules.
- `npm run check`: exit 0; typecheck, 98 unit tests, and Vite production build passed.
