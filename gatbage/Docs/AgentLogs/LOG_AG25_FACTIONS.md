# LOG AG25 Faction Caravans Patrols

Date: 2026-05-17

Implemented bounded faction activity for current-zone play:

- Added `src/data/faction_events.ts` with patrol, relief caravan, tax raid, cult procession, wild looters, and liquidator sweep definitions.
- Added `src/systems/faction_events.ts` with a 10-second scheduler, per-zone cooldowns, current-zone selection, global caps, NPC/drop spawning, economy/container consequences, event publishing, rumor seeding, and debug summaries.
- Added `updateFactionActivity()` in `src/systems/factions.ts` and called it from the main living/death simulation loops.
- Added debug commands to list faction event state and force an event in the current zone.
- Updated `README.md` with shipped behavior and limits.

Validation:

- Baseline pre-edit `npm run build`: passed.
- `npm run typecheck`: passed after resolving existing strict-mode drift in the active tree.
- `npm run check`: passed, including unit tests, build, and smoke playability.
- Forced-event cap probe against compiled code: 40 forced attempts across zone owners produced `eventNpcs=32/32`, `eventDrops=16/24`, `published=12`. Caps held; events remained observable through spawned NPCs, drops, messages, and world-event facts.

Notes:

- Event facts use existing `faction_relation_changed` with `faction_event` tags rather than adding a new `WorldEventType`, keeping core type edits out of this task.
- Relief caravans increase water/food/medicine stock and deposit small supplies into a zone container. Raids and looters apply small negative resource deltas.
