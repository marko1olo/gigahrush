# Status AG40 Container Witness

- [x] Extracted prompt block `AGENT_40_CONTAINER_WITNESS_AUDIT`.
- [x] Read required project docs: `README.md`, `architecture.md`, `desdoc.md` P0.5/P1 A-Life.
- [x] Read required source files: container system/UI, events, NPC memory, rumor, factions, and container defs.
- [x] Baseline `npm run typecheck` passed before code changes.
- [x] Add bounded theft witness detection and consequence event context.
- [x] Add NPC memory, rumor, relation, audit, and UI state for container theft.
- [x] Baseline `npm run typecheck` passed after AG40 edits.
- [x] `npm run test:unit` passed.
- [x] `npm run build` passed as part of `npm run check`.
- [ ] `npm run check` completed through typecheck/unit/build but failed at `npm run smoke`: WebGL canvas sampled blank and inventory HUD delta was unchanged.
