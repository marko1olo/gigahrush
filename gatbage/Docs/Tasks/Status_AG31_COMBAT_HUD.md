# AG31 Combat HUD Readability Status

Date: 2026-05-17

## Scope

Make equipped weapon state readable in the canvas HUD and inventory stats without changing combat balance or adding DOM UI.

## Checklist

- [x] Extracted `AGENT_31_COMBAT_HUD_READABILITY` XML block with CLI.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P0.1 and 12.
- [x] Read required source files: `hud.ts`, `stats_ui.ts`, `hud_fx.ts`, `inventory.ts`, `ai/combat.ts`, `weapons.ts`, `psi.ts`.
- [x] Baseline `npm run typecheck`: passed.
- [x] Audited existing weapon, tool, ammo and durability HUD.
- [x] Added compact bounded weapon-state HUD.
- [x] Mirrored core weapon facts in inventory stats.
- [x] Added unit assertions for the new weapon-readiness helper.
- [x] Ran `npm run check`; blocked by unrelated `src/data/contracts.ts` type errors.
- [x] Ran fallback `npm run build`: passed.
- [x] Ran direct `npm run smoke`: passed.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG31_COMBAT_HUD.md`.

## Baseline Notes

- Existing HUD showed weapon name, damage, ranged ammo count, melee durability, and tool durability above the bottom status bar.
- Existing inventory stats showed one equipped weapon line with damage plus either total current ammo or durability.
- Existing combat state exposes `player.attackCd`; ranged weapons consume `ammoType`; PSI weapons consume `psiCost`.

## Implementation Notes

- Added `getWeaponReadiness()` in `src/systems/inventory.ts` as a bounded query over current equipped weapon, current inventory, RPG PSI and `attackCd`.
- HUD now shows a compact bottom-right weapon panel only when fullscreen overlays are closed and full map is not active.
- HUD facts: weapon name, role, damage, ammo/PSI/durability resource, current cooldown/ready state, and short cannot-fire reason.
- Inventory stats now mirror the same helper facts in two compact lines.
- Text is clamped to panel width with canvas `measureText`; no emoji-only weapon meaning remains.

## Validation

- Baseline before edits: `npm run typecheck` passed.
- After HUD/helper edits: `npm run typecheck` passed once.
- `npm run test:unit` initially reached the new assertion and exposed a stale expected PSI cost; assertion was fixed to use `WEAPON_STATS.psi_rupture.psiCost`.
- Subsequent `npm run typecheck`, `npm run test:unit`, and `npm run check` are blocked by unrelated contract data/type drift:
  `src/data/contracts.ts` entries from line 115 onward are missing required `ContractDef.target`.
- Fallback `npm run build` passed: `dist/index.html` 1,056.69 kB, gzip 320.45 kB.
- Direct `npm run smoke` passed: `hudLit=36864`, `webglLit=1024`.
