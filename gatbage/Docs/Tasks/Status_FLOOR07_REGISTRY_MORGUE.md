# Status: FLOOR07_REGISTRY_MORGUE

Date: 2026-05-18

## Scope

- Added owned design-floor module: `src/gen/design_floors/registry_morgue.ts`.
- Kept current shipped route untouched. The floor is exported as `generateRegistryMorgueDesignFloor()` for a future integrator/debug hook.
- Used existing item ids, side-quest registry, containers, NPC/entity shapes and rare monster kinds.

## Baseline

- Mandatory baseline `npm run build` passed before edits.

## Implementation Notes

- Route id: `registry_morgue`.
- Future anchor: `z=-16`.
- Current fallback floor id for containers: `FloorLevel.MINISTRY`.
- Rooms stamped: reception window, washing corridor, tag room, cold storage shelter, ledger office and contaminated chamber.
- NPCs registered: Фаина Реестровая, Степан Носильный, Ира Заименованная, Санитар Крутов.
- Quests registered: tag recovery, certificate swap, missing body/NELYUD check and medicine-lock access.
- Medical loot is gated through locked/owner/faction containers.
- Rare threats are one NELYUD and one PECHATEED, not a farm.

## Consequence Hook

`morgue_swap_certificate` rewards `archive_access_permit` and `passport_stub`, so a death-record choice changes access/document state outside this floor using existing Ministry/Raionsovet item hooks.

## Validation

- `npm run typecheck` passed after implementation.
