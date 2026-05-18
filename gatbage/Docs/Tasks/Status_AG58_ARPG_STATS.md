# Status_AG58_ARPG_STATS

Agent: AG58_ARPG_STATS  
Prompt: `Docs/AgentPrompts/AGENT_58_ARPG_STATS_EFFECTS.md`  
Domain: RPG stats, inventory, quest rewards, economy hooks, stat UI.

## Preflight

- [x] Extracted prompt block `AGENT_58_ARPG_STATS_EFFECTS`.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P1 ARPG, `rpg.ts`, `stats_ui.ts`, `hud.ts`, `inventory.ts`, `quests.ts`, `economy.ts`, `weapons.ts`, `psi.ts`.
- [x] Ran baseline `npm run typecheck`; current dirty tree fails before AG58 changes. First run reported `src/data/contracts.ts` target-shape errors, second run reported existing unused/undefined errors in `water_bridge.ts`, `map_ui.ts`, `quest_ui.ts`.

## Audit

- Existing STR: max HP and melee damage.
- Existing AGI: movement speed and attack cooldown.
- Existing INT: max PSI and XP gain.
- Gaps: tool/weapon wear, ranged accuracy, PSI casting cost, and contract/document money outcomes were not stat-responsive or visible in the stat panel.

## Implementation

- [x] Added bounded RPG helpers for durability wear, heavy melee handling, ranged spread, PSI cost, contract rewards and document rewards.
- [x] Routed weapon stat reads through effective player stats for heavy melee cooldown, ranged spread and PSI cost.
- [x] Made STR reduce durable melee/tool wear without turning one-use kits into multi-use kits.
- [x] Made INT affect scarcity-adjusted contract rewards and procedural task/document money.
- [x] Reworked inventory stat text into compact low-resolution lines that expose every numeric stat effect.
- [x] Polish pass: checked the 320x200-style inventory layout in `stats_ui.ts`; effects use four 6px monospace lines with truncation and needs bars were tightened to keep weapon/tool facts readable.

## Validation

- [x] `npm run typecheck` passed once after AG58 edits.
- [x] `git diff --check` on AG58 paths passed.
- [x] `npm run check` attempted; blocked during typecheck by concurrent/out-of-scope `src/systems/void_protocols.ts` errors (`WorldEvent` / `WorldContainer` missing imports, unused helpers, and `borrowed_light` type mismatch).
- [x] `npm run build` passed after AG58 edits.
- [x] `npm run smoke` attempted; blocked by out-of-scope runtime `ReferenceError: registerWorldEventObserver is not defined` from `void_protocols.ts`, leaving canvases blank before the inventory panel could be visually validated.
