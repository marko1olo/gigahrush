# Status AG25 Faction Caravans Patrols

Date: 2026-05-17

## Checklist

- [x] Extracted prompt block `AGENT_25_FACTION_CARAVANS_PATROLS`.
- [x] Read `README.md`, `architecture.md`, and required faction/combat/event/economy/container files.
- [x] Baseline `npm run build` passed before edits.
- [x] Added faction event definitions in `src/data/faction_events.ts`.
- [x] Added bounded slow scheduler and debug helpers in `src/systems/faction_events.ts`.
- [x] Added generic slow hook in `src/systems/factions.ts`.
- [x] Added debug inspection/force commands.
- [x] Updated README shipped facts.
- [x] Run `npm run check`.
- [x] Append final report to `Docs/AgentLogs/LOG_AG25_FACTIONS.md`.

## Notes

Implementation uses current player zone only, per-zone cooldowns, and hard caps of 32 event NPCs plus 24 event drops. Runtime facts publish through the existing world event store using the existing `faction_relation_changed` event type with `faction_event` tags to avoid changing core event unions.

Validation passed:

- `npm run check`
- Forced-event cap probe: 40 forced attempts, `eventNpcs=32/32`, `eventDrops=16/24`, `published=12`.
