# AG32 Weapon Role Balance Log

Date: 2026-05-17

## Final Report

Changed:

- Rebalanced all physical weapon stats in `src/data/weapons.ts` to separate emergency melee, cheap pistols, corridor shotgun, ammo-hungry automatic guns, industrial tools, and late energy weapons.
- Rebalanced all PSI weapon costs/timing in `src/data/psi.ts` so base 10 PSI is a hard limit and INT/PSI recovery matter.
- Updated item descriptions, values, and ammo spawn pools in `src/data/items.ts` to match shipped numbers and scarcity.
- Reduced start armory counter ammo in `src/gen/living/tutor_room.ts` from 16 to 8 rounds. The first plot reward still gives 8 rounds, leaving 16 immediate starter rounds total.
- Documented every physical and PSI weapon role plus duplicate justifications in `Docs/Tasks/Status_AG32_WEAPON_BALANCE.md`.

Duplicate audit result:

- No exact physical or PSI duplicate roles remain after stat/resource separation.
- Shotgun/TOZ, pistol family, PPSh/AK/machinegun, nailgun/harpoon, gauss/plasma/BFG, and storm/siren pulse all have distinct resource, spread, speed, pellet, AoE, or PSI-cost reasons to exist.

Validation:

- Mandatory baseline `npm run typecheck` passed before edits.
- Required `npm run check` was run and failed during typecheck on unrelated current-tree errors outside AG32 write scope:
  - `src/gen/maintenance/water_bridge.ts(28,9): error TS6133: 'ci' is declared but its value is never read.`
  - `src/render/map_ui.ts(51,40): error TS18048: 'state' is possibly 'undefined'.`

Risk:

- The worktree is heavily dirty and changed during the balance pass. AG32 did not revert or edit unrelated files outside the prompt write scope.
