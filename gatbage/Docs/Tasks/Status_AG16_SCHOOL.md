# AG16 School Status

Date: 2026-05-17

## Preflight

- Prompt block extracted: `AGENT_16_OBZH_SCHOOL_EVAC`.
- Read required docs and source: `README.md`, `architecture.md`, `Docs/Expansions/06_obzh_school/expansion.md`, `src/gen/living/tutor_room.ts`, `src/gen/living/content_manifest.ts`, `src/data/plot.ts`, `src/systems/quests.ts`, `src/systems/events.ts`.
- Baseline `npm run build`: passed.

## Scope

- Add one LIVING school/OBZh POI as a self-contained content module.
- Register compact side quests and NPCs through existing plot side-quest registry.
- Add school rumors.
- Update README with shipped facts after implementation.

## Progress

- Completed: `src/gen/living/obzh_school.ts` adds the OBZh classroom/shelter POI in LIVING zone 42.
- Completed: `src/gen/living/content_manifest.ts` imports the module through the LIVING manifest.
- Completed: five school NPCs are registered through side-quest plot data: Нина ОБЖ, Мира, Лида, Роман, Вадим.
- Completed: four Нина ОБЖ side quests cover fetch kit, shelter visit, talk chain, and repair-door choice.
- Completed: side VISIT quests can now target a room by `targetRoomName`.
- Completed: `src/data/rumors.ts` adds school/shelter rumors.
- Completed: `README.md` documents the shipped side quests and school POI facts.

## Validation

- Baseline `npm run build` before edits: passed.
- Post-change `npm run build`: passed.
- `npm run typecheck`: blocked by existing unrelated errors in `src/data/dialogue.ts`, `src/gen/void/index.ts`, `src/main.ts`, `src/systems/containers.ts`, and `src/systems/rumor.ts`.
- `npm run check`: blocked at the same `typecheck` stage.
- `npm run test:unit`: blocked at TypeScript compilation by the same unrelated errors plus an existing test strictness error in `tests/events-economy.test.ts`.
- `npm run smoke`: failed before playability validation because existing `systems/rumor.ts` references undefined runtime functions such as `applyRumorEventToNpc`; canvas then remained blank.
