# LOG_MONSTER_20_MARONARY_SIGNALSHCHIK

## 2026-05-18 14:05:50 BST

Implemented `maronary_signalshchik` / `Маронарный Сигнальщик` as a local VOID Maronary signal aftermath encounter.

Files changed:

- `src/gen/void/maronary_signalshchik.ts`
- `src/gen/void/content_manifest.ts`
- `Docs/Tasks/Status_MONSTER_20_MARONARY_SIGNALSHCHIK.md`
- `Docs/AgentLogs/LOG_MONSTER_20_MARONARY_SIGNALSHCHIK.md`

Implementation notes:

- Added a green source room with screen cues, Maronary marks, high-beep note text, cover props, and a local `EYE` pressure monster.
- Added an avoid room for the non-green route.
- Added local container-choice event handling for heard, followed, disabled, avoided, and cleared phases.
- Used existing Maronary tags and event rails; no new samosbor variant was added.
- Breaking the source disables only the local screen source and clears the local pressure monster.

Validation:

- Baseline `npm run typecheck`: exit 0.
- First post-implementation `npm run typecheck`: exit 2, temporarily blocked by untracked out-of-scope files `src/gen/living/plombirovshchik.ts` and `src/gen/maintenance/chernaya_lichinka.ts`.
- Latest `npm run typecheck`: exit 0.
- Latest `npm run check`: exit 0; typecheck, 102 unit tests, and production build passed.
- Targeted VOID generation check: exit 0, found source room, avoid room, live Signalshchik monster, and 4 encounter containers.
