# AG96 Govnyak Item Loop Status

Agent: AGENT_96_GOVNYAK_ITEM_LOOP  
Domain: Items / Inventory / RPG Bounded Condition  
Iteration: 3

## Preflight

- [x] Extracted `<AGENT_PROMPT id="AGENT_96_GOVNYAK_ITEM_LOOP">` from `Docs/AgentPrompts/AGENT_96_GOVNYAK_ITEM_LOOP.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.3 and 16.4.
- [x] Read `src/data/items.ts`, `src/systems/inventory.ts`, `src/systems/rpg.ts`, `src/systems/events.ts`, and `src/data/rumors.ts`.
- [x] Baseline `npm run typecheck`: failed before edits because `package.json` does not define a `typecheck` script.

## Implementation

- [x] Add 2-4 govnyak item ids.
- [x] Add optional use effect with bounded relief and visible cost.
- [x] Add contraband/trade handling through existing economy/inventory paths.
- [x] Add bounded consequence and recovery path.
- [x] Publish use, sale/confiscation, bad batch, and recovery/clearing debt events.
- [x] Add rumor hooks.
- [x] Run available validation.

## Result

- Added `govnyak_roll`, `govnyak_brick`, `govnyak_sample`, and `govnyak_bad_batch` as pressure/contraband items.
- Using govnyak is optional and consumes the item for short PSI relief with thirst/sleep/HP costs, aim-spread cough, timed debt pressure, bad batch risk, and timed recovery.
- Govnyak now enters ordinary trade pools, black-market floor inventories, stash/container pools, and the `contraband` economy resource.
- Use, trade, confiscation, bad batch, debt application, and debt/cough clearing publish structured events and rumor ids.

## Validation

- Baseline `npm run typecheck`: failed before edits because `package.json` does not define a `typecheck` script.
- Final `npm run check`: failed because `package.json` does not define a `check` script.
- Final `npx tsc --noEmit`: passed.
- Final `npm run build`: passed.
- Final `git diff --check` on touched paths: passed.
