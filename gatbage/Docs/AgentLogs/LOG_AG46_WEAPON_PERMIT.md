# AG46 Ministry Weapon Permit Bureau

Date: 2026-05-17

## Summary

Implemented a Ministry weapon-permit bureau as a self-contained POI:

- New `src/gen/ministry/weapon_permit_bureau.ts`.
- Hooked into `src/gen/ministry/content_manifest.ts`.
- Added modest paperwork items in `src/data/items.ts`:
  - `weapon_permit_signed`
  - `weapon_permit_forged`
  - `ammo_issue_order`
- Added system contracts in `src/data/contracts.ts` for legal permit paperwork, ammo-order redemption and forged paperwork.
- Added rumors in `src/data/rumors.ts` for bureau discovery, signed permits and theft/audit risk.

## Gameplay

- Legal route: bring blank forms to the clerk for a signed short-sidearm permit and ammo order.
- Issue route: surrender signed paperwork or ammo order to the guard for a homemade pistol or a small 9mm issue.
- Forgery route: bring a forged stamp sheet to obtain a forged weapon permit.
- Theft route: take from the guard-owned weapon-permit locker; existing container theft events publish `item_stolen` with `weapon_permit`, `audit`, `weapon` and `ammo` tags.

## Balance Note

Compared to the Living starter armory, this opens options without trivializing early expeditions:

- Legal sidearm reward is `homemade_pistol`, weaker and less reliable than the starter Makarov.
- Legal ammo is bounded to 6 rounds with sidearm issue plus 10 from an ammo order.
- The controlled locker has only one homemade pistol, 12 rounds and paperwork.
- No high-tier weapon or late-game ammunition was added.

## Validation

- Baseline `npm run typecheck`: passed before edits.
- Post-edit `npm run typecheck`: blocked by out-of-scope errors observed in `src/gen/maintenance/water_bridge.ts` and `src/render/map_ui.ts`.
- Required `npm run check`: stopped in typecheck on out-of-scope `src/render/map_ui.ts` errors:
  - `activeTargetRoomTypes` declared but never read.
  - `drawQuestDiamond` declared but never read.
