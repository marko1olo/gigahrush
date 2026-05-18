# AG17 Hospital Quarantine Status

Date: 2026-05-17

Prompt block extracted: `AGENT_17_HOSPITAL_QUARANTINE`.

Preflight:
- Read `README.md`, `architecture.md`, `Docs/Expansions/07_hospital_quarantine/expansion.md`.
- Read `src/data/items.ts`, `src/systems/needs.ts`, `src/systems/inventory.ts`, `src/gen/living/yakov_lab.ts`, `src/gen/maintenance/flooded_lab.ts`, `src/systems/events.ts`.
- Baseline `npm run build`: passed before implementation.

Implementation:
- Added `src/gen/living/hospital_quarantine.ts` as a zone 38 living content module.
- Added 5 NPCs, 4 side quests, one sealed quarantine ward, one local outbreak monster, and quarantine med/document containers.
- Added `quarantine_medcard` item and 4 hospital/quarantine contract definitions.
- Routed quarantine container open/theft facts through existing container events with `hospital`/`quarantine` tags.
- Updated README shipped facts.

Validation:
- `npm run typecheck`: passed after implementation.
- Final `npm run build`: passed after implementation.
