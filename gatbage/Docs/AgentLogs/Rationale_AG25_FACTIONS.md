# Rationale AG25 Faction Caravans Patrols

Date: 2026-05-17

The feature is implemented as bounded ambient pressure, not logistics simulation. Definitions live in `data/faction_events.ts`; runtime scheduling and spawning live in `systems/faction_events.ts`; `systems/factions.ts` only forwards a slow generic activity hook.

The scheduler checks every 10 seconds and only considers the player's current zone. That keeps zone activity observable without scanning the whole world or inventing off-screen caravans. Per-zone cooldowns prevent repeating the same beat in one area, while global caps stop repeated debug forcing from growing permanent populations.

Zone ownership is the main selector. Citizen zones can produce relief caravans, liquidator zones raids and sweeps, cult zones processions, wild zones looters, and all owned zones can produce small patrols. Samosbor zones are ignored.

Events publish structured facts through `publishEvent()` with `faction_event` tags, then seed nearby NPC rumor memory through `observeRumorEvent()`. I reused the existing `faction_relation_changed` event type because adding a new event union member would touch `core/types.ts`, outside the requested scope.

The cheap economy/container tie is deliberately cinematic: relief caravans add water/food/medicine stock and deposit small supplies in a zone container; raids and looters drain small resource amounts. There is no persistent trade route state.
