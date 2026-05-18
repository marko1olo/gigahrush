# AG72 Scientist Escort Sample Status

Prompt: `Docs/AgentPrompts/AGENT_72_SCIENTIST_ESCORT_SAMPLE.md`

## Preflight

- XML prompt block extracted by id: `AGENT_72_SCIENTIST_ESCORT_SAMPLE`.
- Read required docs/source: `README.md`, `architecture.md`, `desdoc.md` sections 13, 16.1, 17, `src/data/plot.ts`, `src/systems/quests.ts`, `src/data/contracts.ts`, `src/systems/contracts.ts`, `src/systems/events.ts`, `src/systems/ai/npc_fsm.ts`.
- Baseline `npm run typecheck`: blocked before edits because `package.json` has no `typecheck` script.

## Implementation Notes

- Added `src/gen/living/scientist_escort_sample.ts`.
- Registered Living zone content in zone 55: `Маршрутный пост НИИ Слизи` plus `Запертая пробная белого остатка`.
- Main route:
  - Talk to `Ира Пробиркина`.
  - Talk to checkpoint NPC `Павел Пропускной`; accepting the route spawns nearby monsters and gives a key/container.
  - Open the locked sample room and retrieve `slime_sample_white`.
  - Return it to Iра for the science/protection ending.
- Alternate outcomes:
  - Sell `slime_sample_white` to `Лера Тихая Проба`; this marks the scientist delivery side quest abandoned.
  - Sell `slime_sample_fake` to `Егор Бирочник` for a forged-audit outcome.
  - Refuse by not accepting Iра's route; no quest state is created.
- Failure:
  - Active AG72 scientist quests fail if `Ира Пробиркина` dies.

## Trigger Path

- Start or debug-teleport to `FloorLevel.LIVING`.
- Go to zone HUD #55 / `Маршрутный пост НИИ Слизи`.
- Use the NPC menu: talk to Iра, then choose `Задание`.
- Map/quest UI marks Павел for the TALK step and medical/sample rooms for the FETCH step.

## Validation

- `npm run typecheck`: blocked before edits and after implementation because `package.json` has no `typecheck` script.
- `npm run check`: blocked because `package.json` has no `check` script.
- `npx tsc --noEmit --pretty false`: failed on existing out-of-scope errors:
  - `src/gen/maintenance/pneumomail_station.ts(45,54)` calls a helper with 9 args where 10-11 are required.
  - `src/systems/govnyak.ts(105,10)` declares unused `removeStatus`.
- `npm run build`: passed; Vite produced `dist/index.html`.
