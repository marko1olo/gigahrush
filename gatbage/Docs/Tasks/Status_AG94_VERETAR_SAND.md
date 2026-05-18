# Status AG94 Veretar Sand

Prompt: `AGENT_94_VERETAR_SAND_SAMPLE`

## Preflight

- Extracted prompt block `AGENT_94_VERETAR_SAND_SAMPLE` from `Docs/AgentPrompts/AGENT_94_VERETAR_SAND_SAMPLE.md`.
- Read `README.md`, `architecture.md`, `veretar.md`, `desdoc.md` section 16.3, `src/data/items.ts`, `src/data/contracts.ts`, `src/systems/inventory.ts`, `src/systems/contracts.ts`, and `src/systems/events.ts`.
- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.

## Implementation

- Done: marked `veretar_sand` as unsealed Veretar evidence/reagent with direct item tags, value, bounded stack, and clear warning text.
- Done: added `sealed_veretar_sand`, `sand_spoiled_ration`, and `bleached_document`.
- Done: kept the reachable source through the existing Veretar aftermath item residue hook for `veretar_sand`.
- Done: added Ministry, Yakov/science, and black-market contract handoff paths.
- Done: added narrow inventory handling: use unsealed sand with `sealant_tube` or `seal_wax` to seal it; use without sealing material destroys it.
- Done: added bounded spoilage only when unsealed sand is picked up or when an explicit vulnerable food/document item is picked up while unsealed sand is already carried. Each handling spoils at most one explicit item and warns the player.
- Done: pickup, sealing, spoilage, destruction, and contract handoffs publish through existing world events.

## Validation

- Post-change `npm exec tsc -- --noEmit`: failed on unrelated existing errors outside AG94 files, including `paritel_steam_bridge.ts` custom event type, `main.ts` unused imports/missing `uvBeamFx` and `uvBeamLen`, unused map/container/debug imports, faction clash missing helpers, `govnyak.ts` unused helper, `lift_arachna.ts` unused parameter, and missing `MonsterKind` entries in `rpg.ts`.
- Post-change `npm run build`: passed.
- Post-change `npm run check`: failed because `package.json` has no `check` script.
