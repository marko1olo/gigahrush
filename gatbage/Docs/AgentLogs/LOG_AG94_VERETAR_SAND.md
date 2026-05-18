# LOG_AG94_VERETAR_SAND

## 2026-05-18

- Implemented Veretar sand as inconvenient evidence: `veretar_sand` is tagged as unsealed evidence/reagent/contaminant, while `sealed_veretar_sand` is the safe handoff sample.
- Added spoilage outputs `sand_spoiled_ration` and `bleached_document`.
- Added three contract outcomes in `src/data/contracts.ts`: Ministry sealed evidence, Yakov/science sealed assay, and black-market unsealed purchase.
- Added narrow handling in `src/systems/inventory.ts`: unsealed sand can be sealed with `sealant_tube` or `seal_wax`, destroyed by using it without sealing material, and can spoil one explicit food/document item only during bounded pickup handling.
- Events use existing `player_pick_item`, `player_use_item`, and `contract_*` event types with Veretar/evidence/spoilage/handoff tags.

Validation:

- Baseline `npm run typecheck`: blocked, missing script.
- `npm exec tsc -- --noEmit`: blocked by unrelated existing errors outside AG94 touched paths.
- `npm run build`: passed.
- `npm run check`: blocked, missing script.
