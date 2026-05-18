# AG64 Green Acid Room Log

## 2026-05-18

- Extracted prompt block `AGENT_64_GREEN_ACID_ROOM`.
- Read required preflight docs and source files.
- Baseline `npm run typecheck`: blocked because `package.json` has no `typecheck` script.
- Added `src/gen/maintenance/green_acid_room.ts`.
- Wired the room through `src/gen/maintenance/content_manifest.ts`.
- Added green acid surface marks, dry bypass lanes, warning note, filter-layer countermeasure, acid sample bottle, organic temptation drops, and nearby threat spawns.
- Extended `src/systems/inventory.ts` narrowly so item-drop metadata survives pickup and AG64 acid-tagged organic loot has explicit counterplay:
  - first unsafe pickup warns and publishes an `exposure` tagged inventory event;
  - repeated unsafe pickup spoils only that ground item;
  - carrying `filter_layer` spends one layer, recovers the item, and publishes a `neutralization` tagged event;
  - collecting the acid bottle publishes a `sample` tagged event.
- Validation:
  - `npm run build` passed.
  - `npm run check` blocked because `package.json` has no `check` script.
  - Current final `npx tsc --noEmit --pretty false` is blocked by unrelated dirty-tree errors outside the AG64 room path: duplicate `eventTags` in `src/data/plot.ts`, unfinished/unused `src/gen/hell/thin_wall_chapel.ts` imports, unused `src/gen/maintenance/slime_sample_post.ts` scaffolding, unfinished `src/systems/faction_events.ts` symbols, and unrelated slime/Veretar scaffolding currently present in `src/systems/inventory.ts`.
