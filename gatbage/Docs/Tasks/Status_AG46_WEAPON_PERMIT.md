# AG46 Weapon Permit Bureau Status

Prompt: `AGENT_46_MINISTRY_WEAPON_PERMIT_BUREAU`

## Preflight

- Read prompt XML block from `Docs/AgentPrompts/AGENT_46_MINISTRY_WEAPON_PERMIT_BUREAU.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` P0.1/P1.
- Read mandatory source files:
  - `src/gen/ministry/content_manifest.ts`
  - `src/gen/ministry/admin_common.ts`
  - `src/data/items.ts`
  - `src/data/weapons.ts`
  - `src/data/contracts.ts`
  - `src/data/rumors.ts`
  - `src/systems/containers.ts`
  - `src/systems/economy.ts`
- Baseline `npm run typecheck`: passed before edits.

## Implementation Notes

- Added `src/gen/ministry/weapon_permit_bureau.ts` as the owned POI module.
- Registered it from `src/gen/ministry/content_manifest.ts`.
- Added only permit/document item ids needed by the bureau:
  - `weapon_permit_signed`
  - `weapon_permit_forged`
  - `ammo_issue_order`
- Added discoverability through `src/data/contracts.ts` and `src/data/rumors.ts`.
- Used existing container access/theft events for illegal access risk.
- Reward balance compared to the Living starter armory:
  - Legal path gives a worse sidearm (`homemade_pistol`) plus 6 rounds after surrendering a signed permit.
  - Separate ammo order gives 10 rounds.
  - Theft path exposes one controlled locker with `homemade_pistol`, 12 rounds and paperwork, marked as owner theft/audit risk.
  - No AK, TT, shotgun, machinegun, high-tier ammo or late-game weapons are granted.

## Validation

- Baseline `npm run typecheck`: passed before edits.
- Post-edit `npm run typecheck`: blocked by out-of-scope errors observed in `src/gen/maintenance/water_bridge.ts` and `src/render/map_ui.ts`.
- Required `npm run check`: stopped in typecheck on out-of-scope `src/render/map_ui.ts` unused symbol errors:
  - `activeTargetRoomTypes` declared but never read.
  - `drawQuestDiamond` declared but never read.
