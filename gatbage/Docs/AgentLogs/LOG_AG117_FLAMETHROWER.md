# AG117 Flamethrower Cleanup Log

Date: 2026-05-18

What was done: Made the existing flamethrower a bounded cleanup tool for registered slime residue hazards. The brown-slime maintenance room now registers explicit residue cells, drops a flamethrower with limited fuel, includes flammable collateral near the cleanup target, and supports completion of the brown-slime cleanup assignment through fire as well as the cleaning kit. Flame projectiles now clean registered hazards, fade nearby residue marks before stamping burn marks, emit cleanup/collateral/fuel-empty events, and apply a small backdraft risk when the player burns too close.

Boundaries: No spreading fire, no fluid simulation, no weapon rebalance, no infinite napalm. Cleanup only targets explicit registered cell hazards and short-lived projectile/burn feedback.

Events: Added `burn_cleanup`, `fuel_empty`, and `collateral_damage` event types. Existing `hazard_cleaned` and `contract_completed` continue to publish cleanup facts; cleanup contract completion tags already include `cleanup_completed`.

Validation:

```txt
npm run typecheck
npm error Missing script: "typecheck"

npm run check
npm error Missing script: "check"

npm run build
✓ built in 1.92s

npx tsc --noEmit
exit 0
```

Files changed: `src/gen/maintenance/brown_slime_cleanup.ts`, `src/main.ts`, `src/core/types.ts`, `src/data/contracts.ts`, `src/data/items.ts`, `src/systems/contracts.ts`, `src/systems/inventory.ts`, `src/systems/ai/combat.ts`, `src/systems/world_log.ts`, `Docs/Tasks/Status_AG117_FLAMETHROWER.md`, `Docs/AgentLogs/LOG_AG117_FLAMETHROWER.md`.
