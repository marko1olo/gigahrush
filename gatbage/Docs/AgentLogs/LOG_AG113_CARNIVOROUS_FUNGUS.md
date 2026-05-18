# AG113 Carnivorous Fungus Room Log

## 2026-05-18

- Extracted prompt block `AGENT_113_CARNIVOROUS_FUNGUS_ROOM`.
- Read required preflight docs and source files.
- Baseline `npm run typecheck`: blocked because `package.json` has no `typecheck` script.
- Added `src/gen/carnivorous_fungus_room.ts` for shared fungus-room dressing and marks.
- Added `src/gen/living/carnivorous_fungus_room.ts` and wired it through `src/gen/living/content_manifest.ts` as a reachable LIVING POI.
- Added mushroom-procedural seeding in `src/gen/procedural_floor.ts`.
- Added `src/systems/carnivorous_fungus.ts` for bounded runtime behavior:
  - entry warning and discovered event;
  - local hazard damage only inside active fungus cells;
  - salt/antifungal neutralization;
  - risky raw zhelemish harvest;
  - flame burn-off;
  - raw meat/infected mushroom bait and dead monster/NPC corpse feeding;
  - citizen/liquidator relation penalty for feeding NPC corpses.
- Added `rock_salt` as a small counterplay item in `src/data/items.ts`.
- Wired interaction/update hooks through `src/main.ts`.
- Added AG113 debug summary lines through `src/systems/debug.ts`.
- Updated README shipped facts for LIVING content and procedural mushroom floors.
- Validation:
  - `npm run typecheck` blocked: missing script.
  - `npm run check` blocked: missing script.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
