# AG81 Defector Liquidator Log

## Final Report - 2026-05-18

- Added a Maintenance checkpoint around `Митька Сорванный`, an exhausted compromised liquidator with a hidden supply room, black-hand residue, a witness/radio angle, and lootable personal supplies.
- Added route objective `ag81_find_hidden_supply`, then five resolution paths gated by that route: protect him, report him back to duty, recruit him as an informant, hand his token to a cult courier, or kill/loot him.
- Each resolution publishes a tagged `faction_relation_changed` event, carries rumor ids through quest/event data, and applies faction standing changes. Violence without the formal kill quest has its own fallback outcome.
- Added explicit deadline support for authored side quests that opt in, plus local side-quest prerequisite/blocking fields so AG81 branch offers become available only after the route proof and disappear after a successful ending.

## Validation

- Baseline `npm run typecheck`: blocked because `package.json` does not define `typecheck`.
- `npx tsc --noEmit`: failed on pre-existing unrelated diagnostics; no `defector_liquidator.ts` diagnostics appeared.
- `npm run build`: passed.
- `npm run check`: blocked because `package.json` does not define `check`.
