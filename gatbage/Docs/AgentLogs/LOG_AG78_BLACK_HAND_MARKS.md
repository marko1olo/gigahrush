# LOG AG78 Black Hand Marks

## 2026-05-18

Implemented bounded black-hand cult marks.

- Added a dedicated procedural black-hand shader and content helpers in `src/render/marks.ts`.
- Added bounded per-world black-hand cell metadata for map rendering: max 48 cells per world, max 12 marks per trail.
- Added minimap/full-map black-hand warning pins in `src/render/map_ui.ts` without scanning `surfaceMap` or the world.
- Extended `src/gen/hell/thin_wall_chapel.ts` with a small black-hand trail, Сержант Коптев as a liquidator scout, a VISIT/report quest, and a cult stash at the trail end.
- Reused existing `quest_completed` event publication for reporting and existing container events for stash loot/theft.

Validation:

- `npm run typecheck`: blocked because the script is absent from `package.json`.
- `npx tsc --noEmit --pretty false`: AG78 files are clean, but full repo fails on unrelated existing errors.
- `npm run build`: blocked by an existing duplicate `roomCenter` declaration in `src/gen/procedural_floor.ts`.
- `npm run check`: blocked because the script is absent from `package.json`.
