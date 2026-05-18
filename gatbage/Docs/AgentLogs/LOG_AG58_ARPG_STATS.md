# LOG_AG58_ARPG_STATS

Final report for AG58_ARPG_STATS.

Implemented visible STR/AGI/INT expedition effects without adding a perk tree:

- STR keeps its HP/melee role and now also reduces durable melee/tool wear; heavy non-PSI melee weapons get a small STR handling bonus.
- AGI keeps movement/attack speed and now tightens ranged weapon spread through the existing weapon stat path.
- INT keeps max PSI/XP and now lowers active PSI cast cost, improves system contract money through the economy reward hook, and gives stronger money outcomes for document/paper work.
- Inventory stat UI now shows compact numeric effect lines for STR, AGI, INT, contracts and documents. The selected weapon display uses the shared readiness path so PSI cost changes are visible.

Validation:

- `npm run typecheck` passed once after the AG58 edits.
- `git diff --check` on AG58 paths passed.
- `npm run check` was run and failed during its first typecheck stage on out-of-scope `src/systems/void_protocols.ts` errors.
- `npm run build` passed.
- `npm run smoke` was run and failed on an out-of-scope `void_protocols.ts` startup exception: `registerWorldEventObserver is not defined`. The exception blanked the HUD/WebGL canvases, so no visual inventory-panel claim is made.

I did not edit `void_protocols.ts` because AG58 has an absolute write scope.
