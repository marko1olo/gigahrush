# LOG AG22 Floor Catalog

Date: 2026-05-17

What was done: Added a data-first future pocket catalog with 28 inert `FloorCatalogDef` entries in `src/data/floor_catalog.ts`, plus query/search/format helpers in `src/systems/floor_catalog.ts`.

What changed in debug: Existing debug command 14 now preserves balance output and appends catalog inspection. Repeated activation cycles current-floor listing and searches for numbered pockets, 404, school, hospital and market entries.

What changed in floor manifest: Added `floorLevelDisplayName()` as a read-only metadata helper over the existing `FLOOR_NAMES` map.

What changed in docs: Updated `README.md` with shipped catalog/debug behavior and added AG22 status and rationale docs.

What did not change: No new `FloorLevel`, no generator, no save/load shape, no lift switching change, no route resolver and no pocket spawning.

Validation: Baseline `npm run build` passed before edits. `npx esbuild src/data/floor_catalog.ts src/systems/floor_catalog.ts --format=esm --outdir=/tmp/ag22-floor-catalog-check --log-level=warning` passed for the new catalog files. Final `npm run typecheck`, `npm run build`, and `npm run check` passed after edits.
