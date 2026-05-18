# AG80 Liquidator Cult Clash Status

## Prompt

- Extracted prompt id: `AGENT_80_LIQUIDATOR_CULT_CLASH`
- Domain: Faction Event / Encounter / Rumor Residue
- Goal: bounded liquidator-cult clash with player intervention, loot, evidence, and rumor residue.

## Preflight

- Read `README.md`: done.
- Read `architecture.md`: done.
- Read `desdoc.md` section 16.2: done.
- Read `src/systems/faction_events.ts`: done.
- Read `src/data/faction_events.ts`: done.
- Read `src/systems/factions.ts`: done.
- Read `src/entities/monster.ts`: done.
- Read `src/systems/events.ts`: done.
- Baseline `npm run typecheck`: blocked. `package.json` has no `typecheck` script; available scripts are `dev`, `build`, and `preview`.

## Implementation Status

- Faction event definition/module: done. Existing `cult_liquidator_clash` now owns two clash sides and outcome data.
- Bounded participant spawn and anti-farm cap: done. One clash per floor/zone key, active clash cap, event NPC/drop caps.
- Player intervention paths: done. Player can help liquidators, help cultists, loot during the fight, avoid, or report aftermath to a liquidator.
- Start/intervention/aftermath events: done. Clash phases publish `faction_patrol_clash` with `faction_event` tags.
- Loot/evidence/rumor residue: done. Initial fight loot, outcome evidence drops, pressure marks, and outcome rumor ids are emitted.
- Debug force path: done. Debug command `Форсировать стычку ликвидаторов и культа` calls `cult_liquidator_clash` directly.
- Validation `npm run check`: blocked. `package.json` has no `check` script.
- Validation `npx tsc --noEmit --pretty false`: passed.
- Validation `npm run build`: passed.
