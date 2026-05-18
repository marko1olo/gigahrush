# LOG_AG13_ARCHIVE

## 2026-05-17

- Implemented `src/gen/ministry/raionsovet_archive.ts`: a reachable Ministry archive/passport-card POI with four named NPCs, five side quests, document drops, a `faction` service card index, a `locked` passport safe, and a `secret` forged-paper stash.
- Wired the room through `src/gen/ministry/content_manifest.ts`.
- Added document item ids in `src/data/items.ts`: archive access permit, forged stamp sheet, stolen archive card, missing record file, exposure notice, passport stub, and personal file copy.
- Added archive contracts in `src/data/contracts.ts` for legal permit work, stolen card work, missing file return, and forged stamp supply.
- Added archive/access rumors in `src/data/rumors.ts`.
- Updated `README.md`, `Docs/Tasks/Status_AG13_ARCHIVE.md`, and `Docs/AgentLogs/Rationale_AG13_ARCHIVE.md`.
- Baseline `npm run build` passed before edits.
- Targeted esbuild bundle of `src/gen/ministry/raionsovet_archive.ts` passed.
- Final `npm run typecheck` and `npm run build` are blocked by unrelated dirty-worktree errors in `src/main.ts`, `src/render/hud.ts`, `src/gen/procedural_screens.ts`, and `src/systems/samosbor.ts`; the build blocker is duplicate declarations in `src/systems/samosbor.ts`.
