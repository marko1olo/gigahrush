# AG12 Mushroom Shift Status

Date: 2026-05-17

## Preflight

- [x] Extracted `AGENT_12_MUSHROOM_SHIFT_CONTENT` XML block from `Docs/AgentPrompts/AGENT_12_MUSHROOM_SHIFT_CONTENT.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `Docs/Expansions/01_mushroom_shift/expansion.md`, `content_manifest.md`, and `integration_contract.md`.
- [x] Read required source files: `src/data/items.ts`, `src/data/resources.ts`, `src/systems/production.ts`, `src/gen/living/content_manifest.ts`, `src/gen/kvartiry/content_manifest.ts`.
- [x] Baseline `npm run build`: passed.

## Implementation Checklist

- [x] Add one reachable LIVING mushroom cellar/kitchen/laundry POI.
- [x] Add static mold and wet-room cues with existing textures, features, marks, and item drops.
- [x] Add 3 named NPCs and 4 side quests: disinfectant, ration/contamination pressure, vent repair, hoarder exposure.
- [x] Add 4 item definitions: `spore_print`, `substrate_sack`, `mushroom_mass`, `infected_mushroom`.
- [x] Hook food/resource production through `fungal_inputs`, `food`, and `mushroom_cellar`.
- [x] Add bounded mushroom rumors for wet/mold aftermath without live spread.
- [x] Update README shipped facts.
- [x] Final `npm run build`: passed.
- [x] Final `npm run typecheck`: passed.

## Notes

- The slice is room-scale only. No new floor, renderer asset, per-cell fungus spread, or samosbor scheduler change was added.
- `infected_mushroom` is a clear inventory risk: it feeds the player while subtracting HP.
- The production hook uses the existing room factory model; the POI also places visible items directly so the loop is reachable even when production containers are not nearby.
- Extra `npm run smoke`: passed (`hudLit=36864`, `webglLit=1024`).
