# AG113 Carnivorous Fungus Room Status

## Preflight

- Prompt XML block extracted: `AGENT_113_CARNIVOROUS_FUNGUS_ROOM`.
- Read: `README.md`, `architecture.md`, `desdoc.md` sections 16.5 and 16.6.
- Read required source files: `src/gen/living/mushroom_cellar.ts`, `src/gen/procedural_floor.ts`, `src/systems/events.ts`, `src/render/marks.ts`, `src/systems/inventory.ts`.
- Baseline `npm run typecheck`: blocked, package has no `typecheck` script.

## Implementation

- [x] Add a reachable LIVING corpse-fed fungus room with warning marks, note, bones/meat stains, local salt/reagent/fire counterplay and a guard corpse-bait opportunity.
- [x] Seed bounded carnivorous fungus rooms on `mushroom_mycelium` procedural floors.
- [x] Add local room-only hazard checks, risky harvest, safe salt neutralization, fire burn-off, bait/corpse feeding and social penalty for NPC corpse feeding.
- [x] Publish discovered, neutralized, harvested, fed, burned and corpse-handling events through existing event types/tags.
- [x] Add `rock_salt` counterplay item.
- [x] Add debug summary lines under the existing balance/catalog debug command.
- [x] Update README shipped facts.
- [x] Append final report to `Docs/AgentLogs/LOG_AG113_CARNIVOROUS_FUNGUS.md`.

## Validation

- `npm run typecheck`: blocked, package has no `typecheck` script.
- `npm run check`: blocked, package has no `check` script.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.

## Notes

- No global fungus spread, corpse physics or fluid simulation was added.
- Runtime scans are bounded by a slow accumulator, player radius and per-tick handling caps.
