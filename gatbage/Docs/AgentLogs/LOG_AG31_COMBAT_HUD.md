# AG31 Combat HUD Log

Date: 2026-05-17

## Final Report

Implemented:

- Added bounded weapon readiness query in `src/systems/inventory.ts`: role, damage label, ammo/PSI/durability resource, cooldown label, and cannot-fire reason.
- Replaced the old one-line HUD weapon readout with a compact bottom-right canvas panel in `src/render/hud.ts`.
- Hid the weapon panel under fullscreen overlays and full map to avoid overlap with inventory, quest log, log menu, faction/menu/NPC/container overlays, and map.
- Mirrored the same weapon readiness facts in `src/render/stats_ui.ts`.
- Added focused assertions in `tests/inventory-rpg.test.ts` for ammo label, cooldown label, and PSI cannot-fire reason.

Validation:

- Baseline `npm run typecheck`: passed before edits.
- Post-edit `npm run typecheck`: passed once.
- `npm run check`: blocked at `npm run typecheck` by unrelated `src/data/contracts.ts` entries missing required `ContractDef.target` from line 115 onward.
- Fallback `npm run build`: passed. Output `dist/index.html` 1,056.69 kB, gzip 320.45 kB.
- Direct `npm run smoke`: passed with `hudLit=36864`, `webglLit=1024`.

Notes:

- No weapon balance numbers were changed.
- No DOM UI was added.
- The repository was heavily dirty before AG31 started; unrelated contract errors appeared after the baseline and were not fixed because `src/data/contracts.ts` is outside AG31 write scope.
