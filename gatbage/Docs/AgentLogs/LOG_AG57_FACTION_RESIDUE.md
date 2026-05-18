# LOG_AG57_FACTION_RESIDUE

2026-05-17

- Read AG57 prompt, `README.md`, `architecture.md`, desdoc P1 A-Life, faction event data/runtime, factions, marks/blood, events, rumor, and rumor data.
- Baseline `npm run build` passed before implementation.
- Added data-defined faction residue: bounded mark specs, pressure specs, and residue summaries for patrol, relief caravan, tax raid, cult procession, wild looters, and liquidator sweep.
- Runtime now stamps local procedural marks near the event center, applies bounded faction-control pressure cells in the current zone, deposits local container residue where definitions request it, and publishes residue context in world events.
- Debug `forceFactionEvent` summaries now report NPCs, drops, marks, container deposits, and pressure cells.
- Rumor bridge now treats faction residue events as high-signal local rumors and maps them to existing faction rumor lines.
- Fixed current context/rumor duplicate declarations so TypeScript can complete, and kept NPC-offered contract-template quests compatible with the current unit expectations.

Forced-event residue pass:
- `patrol`: NPC 3, drops 1, marks 3, pressure 24; trace is cigarette/scuff patrol residue.
- `relief_caravan`: NPC 3, drops 3, marks 3, container deposits 2, pressure 29; trace is water/bread/bandage, wet/chalk marks, local supply boost.
- `tax_raid`: NPC 2, drops 1, marks 4, container receipt 1, pressure 59; trace is raid note, bullet/blood marks, document/food loss.
- `cult_procession`: NPC 4, drops 1, marks 4, pressure 40; trace is meat rune, PSI/gore marks, PSI stock change.
- `wild_looters`: NPC 3, drops 1, marks 5, container note 1, pressure 33; trace is cigarettes, blood/scuffs, food/tools loss.
- `liquidator_sweep`: NPC 4, drops 1, marks 6, pressure 77; trace is ammo, bullet/scorch/blood marks, ammo stock loss.

Validation:
- `npm run typecheck`: passed.
- `npm run test:unit`: passed.
- `npm run build`: passed.
- `npm run check`: typecheck, unit tests, and build passed; smoke is blocked by the current headless Chrome/WebGL readback result: `WebGL canvas appears blank (0 lit samples)` after movement.
