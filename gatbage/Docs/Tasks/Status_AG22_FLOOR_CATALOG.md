# Status AG22 Floor Catalog

Date: 2026-05-17

## Scope

Task source: `Docs/AgentPrompts/AGENT_22_FLOOR_CATALOG_POCKETS.md`

Goal: add a data-first catalog for future pocket and numbered-floor ideas without adding `FloorLevel` values, route behavior, save/load behavior, or generators.

## Checklist

- [x] Extracted prompt block `AGENT_22_FLOOR_CATALOG_POCKETS`.
- [x] Read `README.md`, `architecture.md`, `src/gen/floor_manifest.ts`, `src/core/types.ts`, `src/main.ts` floor switching, `Docs/Expansions/INDEX.md`, and `expansion.md`.
- [x] Ran baseline `npm run build` before edits.
- [x] Added `src/data/floor_catalog.ts`.
- [x] Added `src/systems/floor_catalog.ts`.
- [x] Added read-only floor display helper in `src/gen/floor_manifest.ts`.
- [x] Added debug inspection through the existing balance/debug command in `src/systems/debug.ts`.
- [x] Updated `README.md` with shipped catalog/debug facts.
- [x] Ran final `npm run typecheck`.
- [x] Ran final `npm run build`.
- [x] Ran final `npm run check`.

## Result

`FLOOR_CATALOG` now contains 28 inert future pocket definitions. Each entry has an id, display name, existing base floor, tags, rarity, minimum depth, unlock hint and content status. The query system supports lookup by id, base floor, tag set, rarity, depth and search string.

Debug command 14 now keeps its population/item summary and also prints catalog lines. Repeated use cycles current-floor listing and searches for `numbered`, `404`, `school`, `hospital`, and `market`.

## Boundaries

No new `FloorLevel` was added. No generator, save/load, lift switching, route resolver, pocket spawn, or travel behavior was added.

## Validation Notes

Baseline `npm run build` passed before AG22 edits.

Targeted esbuild transform of `src/data/floor_catalog.ts` and `src/systems/floor_catalog.ts` passed.

Final `npm run typecheck`, `npm run build`, and `npm run check` passed after AG22 edits.
