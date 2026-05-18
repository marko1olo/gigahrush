# AG37 Samosbor Aftermath Status

Prompt: `AGENT_37_SAMOSBOR_SHELTER_AFTERMATH`

## Preflight

- Extracted XML block from `Docs/AgentPrompts/AGENT_37_SAMOSBOR_SHELTER_AFTERMATH.md`.
- Read `README.md`, `architecture.md`, `desdoc.md` P0.4/P0.5.
- Read target systems/data: `src/systems/samosbor.ts`, `src/data/samosbor_variants.ts`, `src/data/samosbor_director.ts`, `src/systems/samosbor_director.ts`, `src/systems/containers.ts`, `src/systems/economy.ts`, `src/systems/rumor.ts`, `src/systems/events.ts`.
- Baseline `npm run build`: passed.

## Audit Notes

- Existing aftermath has 9 direct beats in `SAMOSBOR_AFTERMATH_BEATS`.
- Existing direct aftermath effects already cover fog residue, door fault, late monster, rumor seed, production shortage, faction panic, container opening and false all-clear.
- Existing director has separate `aftermath` phase with resource, monster and rumor beats.
- Needed pass: expand to at least 10 direct concrete beats across civil, maintenance, hell and void roles; make container/economy and leftover threat coverage explicit; keep cooldown/max-run/floor filters bounded.

## Implementation

- Added 14 direct aftermath beats, bringing the direct aftermath deck from 9 to 23 beats.
- Coverage added:
  - Civil: ration queue shortage, ministry forms shortage, open fridge, stairwell denunciation, liquidator sweep pressure.
  - Maintenance: pressure drop, burnt tool locker, service airlock fault, late tube eel.
  - Hell: cult cache, herald afterimage, meat supply rot.
  - Void: PSI cache, spirit echo, false map fog.
- Consequence coverage:
  - Economy/resource shifts: food, documents, drink water, industrial slurry.
  - Containers: open fridge, burnt tool locker, cult cache, void PSI cache.
  - Leftover threats: tube eel, herald, spirit.
  - Door fault: service airlock fault.
  - Rumor/social pressure: stairwell denunciation and liquidator sweep pressure.
- Aftermath publication now maps concrete effects to more specific structured event types:
  - `production_shortage` -> `room_lacked_resources`
  - `container_theft` -> `item_stolen`
  - `door_fault` -> `door_opened`
- Existing debug summary already reports last aftermath ids, pending state and cooldown; no parallel debug path added.
- Polish audit: each new beat has a bounded floor filter, cooldown and max-run cap; no new beat can fire without a fresh samosbor aftermath application.

## Validation

- Baseline `npm run build`: passed before implementation.
- `npm run typecheck`: failed in existing `src/data/contracts.ts` because many `ContractDef` entries lack required `target`.
- Scoped TypeScript scan for `samosbor`/AG37 files: no errors reported.
- `npm run check`: failed at the same `typecheck` step before unit/build/smoke could run.
- Post-change `npm run build`: passed.
- Post-change `npm run smoke`: passed.
