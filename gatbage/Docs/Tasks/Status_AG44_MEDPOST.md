# Status AG44 Living Emergency Medpost

Prompt: `AGENT_44_LIVING_EMERGENCY_MEDPOST`

## Preflight

- Extracted prompt block by id.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` P0.5 and P2.
- Read required Living content, hospital, item, contract, container and economy files.
- Baseline `npm run build`: passed.

## Plan

1. Add a small protected Living emergency medpost POI.
2. Spawn doctor/orderly NPCs with finite medicine and side-quest hooks.
3. Add owned/faction/locked med containers with scarce medicine.
4. Add contract and rumor leads tied to the medpost.
5. Validate with `npm run check`.

## Balance Notes

- The medpost provides choices around finite supplies: trade, restock, steal or leave.
- No free healing station or medical simulation is added.

## Implementation

- Added `src/gen/living/emergency_medpost.ts`.
- Registered `Аварийный медпост` through `src/gen/living/content_manifest.ts` at Living zone HUD 44.
- Spawned `Доктор Круглов` as a finite medicine trader and side-quest giver.
- Spawned `Санитар Борт` as a liquidator guard for theft pressure.
- Added three finite medical containers:
  - `Сумка доктора Круглова`: owner access, small medicine stock, theft event path.
  - `Шкаф аварийного медпоста`: scientist faction access, restock/theft pressure.
  - `Опечатанный бокс антибиотиков`: locked access, very small high-value medicine stock.
- Added side quest `ag44_medpost_restock_bandages`.
- Added contract `medpost_bandage_restock`.
- Added rumor `room_emergency_medpost`.

## Player Verification

1. Start on `Жилая зона`.
2. Find zone HUD 44 and enter `Аварийный медпост`.
3. Talk to `Доктор Круглов`.
4. Choose one path:
   - Trade for a small finite medical stock.
   - Restock by bringing three `bandage`.
   - Steal from the doctor bag, faction cabinet, or locked antibiotic box.
   - Leave supplies untouched.
5. Confirm theft routes use existing container events and do not create free healing.

## Validation

- Baseline `npm run build`: passed before implementation.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed after waiting for concurrent `.test-build` users to finish.
- `npm run build`: passed.
- `npm run check`: attempted, but the shared workspace repeatedly had concurrent validation processes mutating `.test-build`; a quiet attempt then reached smoke coverage through separate subcommands.
- `npm run smoke`: failed in the current tree with WebGL blank-canvas checks:
  - `after movement: WebGL canvas appears blank (0 lit samples)`
  - `after inventory close: WebGL canvas appears blank (0 lit samples)`

AG44 adds no render code; the smoke failure is recorded as the remaining current-tree validation blocker.
