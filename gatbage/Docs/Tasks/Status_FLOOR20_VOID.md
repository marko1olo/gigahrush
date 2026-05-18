# Status FLOOR20 VOID

Date: 2026-05-18
Prompt: `FLOOR20_VOID`

## Preflight

- Read mandatory docs: `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/void.md`.
- Read Void references: `src/gen/void/content_manifest.ts`, `src/gen/void/index.ts`, `src/gen/void/protocol_chamber.ts`, `src/gen/void/borrowed_light_rule.ts`, `src/data/void_protocols.ts`, `src/systems/void_protocols.ts`, `src/systems/events.ts`.
- Read `Docs/Expansions/10_void_afterprotocol/` references.
- Baseline `npm run build`: passed before implementation.

## Implemented

- Added `src/gen/void/trace_seal_protocol.ts`.
- Hooked it from `src/gen/void/content_manifest.ts`.
- New Void room: `Черный ящик подъезда`.
- Added local NPCs through side-effect plot registration with no quests:
  - `floor20_void_protocol_clerk`
  - `floor20_void_borrowed_neighbor`
- Added black-box trace container with an authored target key.
- Added one local protocol slice: `trace_seal` / `Запечатать след`.
- Player choice is container-driven:
  - `Бланк: запечатать след` seals the authored target door, marks the room sealed, closes a bounded neighboring backlash door, spawns one local Paragraph, deals 1 nonlethal HP backlash, and publishes `void_protocol_*` events.
  - `Бланк: стереть след` erases local apparatus/screen trace, opens the authored target door, applies short PSI confusion, and publishes `void_protocol_*` events.
- Choice state is stored on container tags (`resolved`, `sealed` or `erased`) so the chamber cannot replay both branches after saved container state is restored.

## Validation

- Baseline `npm run build`: passed.
- Post-change `npm run build`: passed.
- `npx tsc --noEmit --noUnusedLocals false --noUnusedParameters false`: passed.
- `npm run typecheck`: blocked by unrelated pre-existing strict unused-local error:
  - `src/gen/design_floors/chthonic_attic.ts(273,9): error TS6133: 'evidenceDoor' is declared but its value is never read.`
- `npm run check`: blocked at the same first `typecheck` stage before unit/build/smoke could run.
- Standalone `npm run smoke`: passed (`hudLit=6253`, `hudCenterLit=128`, `sceneLit=202147`).

## Notes

- No final victory flow, Creator flow, floor enum, save schema, samosbor system, or global protocol runtime was rewritten.
- No full-world search was added. The protocol uses authored door/container ids captured during Void generation and a bounded context list.
