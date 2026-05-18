# LOG AG103 Zhelemish Skin

## 2026-05-18

Implemented a reversible zhelemish skin status using the existing zhelemish resource ids.

- Added `zhelemish_skin` as a timed status on `Entity.statuses`, coexisting with govnyak statuses.
- Raw zhelemish applies a 180s skin with raw bad-reaction chance; dried/boiled apply a treated 150s skin.
- Wired benefit/cost into runtime: melee damage reduction, movement slow, healing friction, water drain and bad-reaction water/PSI cost.
- Added medicine cure through `antifungal_ointment` and `antibiotic`.
- Added HUD and stats panel visibility.
- Added save/load and floor-transition preservation.
- Published applied/expired/cured/bad-reaction events and world-log text.
- Added focused inventory/RPG status tests.
- Regenerated `dist/index.html` through the successful build.

Validation:

- `npm run typecheck`: blocked, missing script.
- `npm run test:unit`: blocked, missing script.
- `npm run check`: blocked, missing script.
- `npx tsc --noEmit`: failed on unrelated dirty-checkout errors already present in other areas.
- `npm run build`: passed.
