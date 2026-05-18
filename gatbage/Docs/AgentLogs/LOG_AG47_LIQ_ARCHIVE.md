# LOG_AG47_LIQ_ARCHIVE

## 2026-05-17

- Implemented `src/gen/ministry/liquidator_archive.ts`: a reachable Ministry archive with an internal locked records gate, liquidator guard pressure, three records/combat containers, a named Paragraph threat, and a supporting печатеед.
- Wired the archive through `src/gen/ministry/content_manifest.ts`.
- Added four L-47 system contracts in `src/data/contracts.ts`: inspect the archive file, retrieve a liquidator token, kill Paragraph L-47, and steal a sealed report using existing item ids.
- Added `contract_liquidator_archive_l47` in `src/data/rumors.ts` with a concrete lead to the room, monster, records container, and token.
- Kept contracts route/risk/reward focused: each points to the Ministry archive, names the danger or theft risk, and pays in ammo, medical prep, documents, XP, money, and liquidator relation.
- Preserved the existing plot chain and did not add a document database.
- Fixed the generic contract event path so NPC-issued contract templates publish `contract_created` with contract target metadata.

Verification:

- Baseline `npm run build` passed before edits.
- `npm run typecheck` passed.
- `npm run test:unit` passed.
- `npm run build` passed during `npm run check`.
- `npm run smoke` failed in headless Chrome after launch: the smoke sampler reported a blank WebGL canvas and no inventory-panel brightness delta. The changed AG47 files do not touch the living start floor or renderer; this needs a renderer/smoke follow-up before `npm run check` can be called fully green.
