# LOG_AG61_SLIME_DEFS

## 2026-05-18

Implemented AG61 as a data-only slime definition rail.

- Added `src/data/slime_defs.ts` with 8 MVP slime definitions: brown, green, white, red, black, blue, silver and seroburmaline.
- Each slime definition has a stable id, Russian display name, tags, danger score, cleanup hint, sample id, reward tier, preferred factions and rumor text handle.
- Linked the 8 sample item ids through `src/data/items.ts`; future slime sites/contracts own actual placement.
- Kept the concurrently added computed `slime_sample_silver` item as the silver sample target and removed the duplicate AG61 literal entry.
- Added `slime_samples` to `src/data/resources.ts` so economy/contracts can resolve the sample ids.
- Added 8 short slime rumors in `src/data/rumors.ts`; each reveals a sample item id.
- Extended `tests/data-ids.test.ts` to catch duplicate/drift issues across slime defs, sample items, resources and rumors.

Validation:

- Baseline `npm run typecheck`: failed, current `package.json` has no `typecheck` script.
- `npx tsc --noEmit`: passed once after AG61 edits; final rerun is now blocked by concurrent/out-of-scope edits in `src/gen/maintenance/slime_sample_post.ts`, `src/render/hud.ts`, `src/render/marks.ts`, `src/systems/quests.ts`, and `src/systems/samosbor.ts`.
- Targeted AG61 data compile (`npx tsc --noEmit ... src/data/slime_defs.ts src/data/items.ts src/data/resources.ts src/data/rumors.ts`): pass.
- `npx tsc -p tsconfig.test.json`: passed before later concurrent source drift.
- Final `npm run typecheck`: failed, missing script.
- Final `npm run test:unit`: failed, missing script.
- `node --test .test-build/tests/data-ids.test.js`: pass, 6/6.
- `node --test .test-build/tests/*.test.js`: 39 pass, 2 existing failures in `tests/procedural-floors.test.ts` because the tests expect 10 procedural slots while current route data exposes 60.
- `git diff --check` on AG61 files: pass.
