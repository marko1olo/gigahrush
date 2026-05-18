# LOG_AG01_EVENTS

## 2026-05-17 AGENT_01_EVENTS_WORLDLOG

What was wrong:
- World actions were mostly direct `state.msgs.push(...)` strings. They produced HUD feedback but no bounded structured memory for samosbor, inventory, quest, or kill facts.
- Old saves had no event state, so event storage had to be optional and normalized.
- Event visibility had no debug surface.

What was done:
- Added `WorldEventType`, `WorldEvent`, `WorldEventDraft`, `ContextFact`, `EventFilter`, fixed capacities, and optional `GameState.worldEvents`.
- Implemented `src/systems/events.ts` with fixed ring buffers: 512 recent events, 128 important events, 32 events per 64 zones, monotonic ids, recent/zone queries, important query, save trimming, and old-save normalization.
- Implemented `src/systems/world_log.ts` with severity/privacy gates, type+actor+target+zone+item soft dedupe, HUD conversion, and L-log entries.
- Initialized event state on new game, normalized it on load, trimmed it on save, and prevented same-timestamp event HUD lines from being logged twice by `syncMsgLog`.
- Wired samosbor start, warning, zone capture, end, fog boss spawn, and fog boss kill events. Fog spread and repeated fog minion spawns were intentionally not published.
- Wired player inventory pickup, drop, use, tool break, and centralized ammo consume events through optional `GameState` parameters so AI callers kept current signatures.
- Wired quest accepted/completed events after current quest mutation and reward logic.
- Wired player monster/NPC kill events from `handleKill` without changing XP, plot, or quest counters.
- Added debug command `Последние события` to print buffer counts and the last 10 important event ids/types.
- Updated README with factual implemented behavior only.

Cinematic Cheats used:
- No physical/log simulation of fog spread. Only phase transitions and boss lifecycle are chronicled.
- Ammo consumption is severity 0: queryable fact, not HUD/log noise.
- Debug event inspection is operator-triggered; no per-frame overlay scan.

Exact Microseconds saved / cost:
- Ring-buffer publish: estimated <10 us per event on i3/MX350-class hardware.
- Samosbor transition events: estimated <50 us per phase; avoided thousands of potential fog-cell/fog-minion events.
- Inventory/quest/kill events: estimated <10 us per user action or kill.
- World-log conversion: estimated <15 us for loggable events; skipped for low-severity ammo/noise.
- Runtime cost of README/status/log documentation: 0 us.

Verification:
- Baseline `npm run build`: passed before edits.
- Checkpoint after tasks 1-5 `npm run build`: passed.
- Checkpoint after tasks 6-10 `npm run build`: passed.
- Final `npm run build`: passed.
- Polish read completed after all 12 tasks: no unbounded event arrays, no unused abstractions requiring another agent, no new economy/container/rumor/contract logic.

## 2026-05-17 AGENT_01_EVENTS_WORLDLOG Round 2

What was wrong:
- Production only published output and input-shortage facts; missing/full output containers were silent.
- Generated contracts published as generic `quest_created` facts, so contract creation/completion/failure could not be filtered cleanly.
- Rumors had an import-free observer, but spoken rumors did not publish event facts.
- Debug event inspection listed recent important events but did not group event health by floor/zone.
- Event tags/data were accepted as caller-supplied objects, so Round 2 tightened bounded payload behavior.

What was done:
- Added event types for `room_blocked_production`, `contract_created`, `contract_completed`, `contract_failed`, `rumor_observed`, `rumor_spread`, `faction_patrol_clash`, and `floor_transition`.
- Hardened `publishEvent()` and save normalization with capped/deduped tags and compact event data records.
- Published production blockage reasons for `no_container`, `no_inputs`, and `container_full`; production output now includes zone ids and capped output data.
- Published contract creation/failure in `contracts.ts`; contract quest completion now emits `contract_completed`.
- Published quiet `rumor_spread` events when an NPC tells a selected static rumor; `observeRumorEvent()` can publish `rumor_observed` when future callers pass state.
- Expanded world-log formatters for player-understandable contract/theft/rumor/faction/floor facts, while keeping production/container-open/rumor-observed telemetry out of normal HUD narration.
- Added debug floor/zone grouping from the important-event ring buffer only.
- Updated README with shipped event producers and debug summary behavior.

Cinematic Cheats used:
- Production and rumor telemetry stays in bounded event buffers instead of becoming HUD chatter.
- Event-to-rumor observation remains deferred because `publishEvent()` has no witness list; scanning NPCs from the event bus would violate the no full-world scan rule.
- Faction patrol clash and floor transition publish sites remain deferred to their owning AI/main integration passes rather than adding broad hooks here.

Verification:
- Baseline `npm run build`: passed before Round 2 edits (`vite build`, 171 modules, `dist/index.html` 734.43 kB, gzip 227.10 kB).
- Source checkpoint `npm run typecheck`: passed after AG01 source edits.
- Final `npm run typecheck`: passed.
- Final `npm run build`: passed (`vite build`, 201 modules, `dist/index.html` 999.77 kB, gzip 302.18 kB, built in 1.24s).
- Formatter polish read completed: new formatters are non-duplicative and telemetry-only event types are suppressed from normal HUD/log narration.
