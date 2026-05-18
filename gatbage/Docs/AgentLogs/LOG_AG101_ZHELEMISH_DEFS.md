# AG101 Zhelemish Resource Defs Log

## 2026-05-18 AG101 Data Rail

What was done:
Added a compact `src/data/zhelemish_defs.ts` rail for the three stable item ids: `zhelemish_raw`, `zhelemish_dried`, and `zhelemish_boiled`. Each form now has tags, trade roles, faction interest, source floor/room hints, use/risk hints, base price, and future quest hook labels.

Data wiring:
The three forms are in `ITEMS` with Russian display names, prices, room spawn hooks, and existing trivial local use callbacks only. `RESOURCES` now has a scarce `zhelemish` resource so economy pricing can treat the family separately from ordinary food/medicine. NPC trade pools expose dried stock through cooks/pilgrims, boiled stock through doctors, and raw stock through storekeepers/scientists. `catalog.ts` re-exports the definitions for later agents.

Rumors:
Added five zhelemish rumors covering cellar food, dried ration use, counterfeit medicine, NII sample interest, and cult/curse framing. The tone is folk resource with a bad price, not a joke.

Tests:
Updated `tests/data-ids.test.ts` with focused AG101 coverage: the zhelemish defs must validate, resolve to `ITEMS`, match item prices, resolve through `RESOURCES.zhelemish`, and be represented by item rumors.

Validation:
Baseline `npm run typecheck` is unavailable because `package.json` has no `typecheck` script.
`npm run test:unit` is unavailable because `package.json` has no `test:unit` script.
`npx tsc --noEmit` is blocked by existing unrelated compile errors outside AG101 files.
`npx tsc -p tsconfig.test.json --noEmit` is blocked by existing unrelated compile errors outside AG101 files and test helpers.
`npm run build` is blocked by the existing duplicate `roomCenter` declaration in `src/gen/procedural_floor.ts`.
Focused AG101 esbuild/data validation passed for item ids, prices, zhelemish resource membership, rumor item reveals, and `validateZhelemishDefs()`.

Integrator notes:
This slice did not add a cellar/POI or zhelemish status system. The shared worktree already contains later zhelemish-related files; AG101 only added the data rail and adjusted the item descriptions to avoid claiming unsupported status behavior from this slice.
