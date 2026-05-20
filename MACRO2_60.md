# MACRO2_60: Faction Event Residue

Модель: GPT-5.5, reasoning extra high.

Цель: faction events leave visible aftermath: bodies/drops/marks/zone pressure/rumor/NPC behavior.

Критично: events that only publish telemetry do not change player planning.

Ownership: `src/systems/faction_events.ts`, `src/data/faction_events.ts`, `src/systems/world_log.ts`, `tests/faction-events.test.ts`.

Читать: `README.md Factions`, `src/systems/faction_events.ts`, `src/data/faction_events.ts`.

Deliverables:
- each high-priority event has player-visible residue and cleanup/avoid/report choice;
- cult procession, liquidator clash and shortage events have distinct traces;
- bounded local updates.

Проверки: `npm run test:unit`, debug force faction event.

Параллельные ограничения: no global war simulation.
