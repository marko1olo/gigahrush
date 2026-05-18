# AG117 Flamethrower Cleanup Status

Date: 2026-05-18

## Scope

Prompt: `AGENT_117_FLAMETHROWER_CLEANUP_SLICE`

Goal: make the existing flamethrower/napalm path a bounded industrial cleanup tool for slime/fungus residue and area denial, with scarce fuel and hazards, not a pure DPS upgrade.

## Preflight

- [x] Extracted `AGENT_117_FLAMETHROWER_CLEANUP_SLICE` XML block by id from `Docs/AgentPrompts/AGENT_117_FLAMETHROWER_CLEANUP_SLICE.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.1 and 16.6.
- [x] Read `src/data/weapons.ts`.
- [x] Read `src/systems/inventory.ts`.
- [x] Read `src/systems/ai/combat.ts`.
- [x] Read `src/data/contracts.ts`.
- [x] Read `src/systems/contracts.ts`.
- [x] Read `src/render/hud_fx.ts`.
- [x] Created this status file.
- [x] Baseline `npm run typecheck`: failed because `package.json` has no `typecheck` script.

## Implementation

- [x] Added flamethrower cleanup handling for explicit registered hazard targets through `cleanCellHazardsNear(..., 'fire')`.
- [x] Added reachable flamethrower and scarce fuel drops to the brown-slime maintenance cleanup room.
- [x] Added hazard cost through fuel-empty feedback, backdraft/self-risk, noise/smoke event tags, and flammable loose-item collateral.
- [x] Integrated the existing brown-slime cleanup assignment so fire can complete the cleanup act faster than the cleaning kit.
- [x] Published `burn_cleanup`, `fuel_empty`, `collateral_damage`, hazard-cleaned, and existing cleanup contract completion events.
- [x] Ran final validation.

## Validation

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
