# AG12 Mushroom Shift Log

Date: 2026-05-17

## Final Report

- Added `src/gen/living/mushroom_cellar.ts`, registered from the LIVING content manifest.
- Added a protected zone 32 mushroom прачечная POI with wet floor cells, rotten wall texture, shelves, sink/machine/apparatus props, static mold marks, and direct mushroom/substrate drops.
- Added Егор Плесень, Ольга Санпропуск, and Валера Мешков with four side quests covering vent repair, disinfectant, dirty ration pressure, and hoarder exposure.
- Added item ids `spore_print`, `substrate_sack`, `mushroom_mass`, and `infected_mushroom`; the infected mushroom is edible but damages HP.
- Added `fungal_inputs` resource and `mushroom_cellar` factory output for mushroom mass and infected mushrooms.
- Added two mushroom rumors and updated README shipped facts.

## Validation

- Baseline `npm run build`: passed before edits.
- Final `npm run build`: passed.
- Final `npm run typecheck`: passed.
- Extra `npm run smoke`: passed (`hudLit=36864`, `webglLit=1024`).
