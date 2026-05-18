# AG09 Rumors / Memory / A-Life Log

## 2026-05-17

What was wrong:
- Ordinary NPC talk was mostly generic pools with plot lines taking priority, but no bounded personal memory, no rumor catalog, and no context-driven ordinary fallback.
- Combat and ambient barks had large pools, but no bounded entity-level dedupe and no context-aware wounded/fear/faction override inside AG09 scope.
- AG01 event infrastructure exists in this checkout, but AG09 could not safely require it under parallel-agent constraints.

What was done:
- Added `src/data/rumors.ts` with 70 `RumorDef` entries across samosbor, rare item, faction, room, monster, floor, and player-action topics.
- Added `src/data/context_lines.ts` for hunger, thirst, wounds, dangerous zone, safe own zone, samosbor aftermath, trust, occupation, faction, and bark override pools.
- Added `src/systems/context.ts` with optional `ContextSnapshot` builder for NPC-local data plus world/state/player data when future callers provide it.
- Added `src/systems/npc_memory.ts` with bounded module-level `NpcMemory` store: 1536 NPC cap, 12 rumors per NPC, trust/fear, helped/hurt counters, cooldown timestamps.
- Added `src/systems/rumor.ts` for trust/floor/context rumor selection, remembrance, decay support, import-free `observeRumorEvent()`, and staggered `tickNpcRumorLowFrequency()`.
- Updated `src/data/dialogue.ts` so plot `talkLines` remain priority and ordinary NPCs can fallback to context lines, rumor lines, state text, then generic pools.
- Updated `src/systems/ai/barks.ts` so existing bark call sites gain wounded/fear/faction context overrides plus bounded same-line cooldowns.
- Updated `src/systems/ai/npc_fsm.ts` with low-frequency memory and rumor ticks inside the existing NPC update path.
- Updated `README.md` with factual docs for NPC memory, context snapshots, and rumors.

Cinematic Cheats used:
- Static rumor catalog instead of live omniscient text generation.
- Context snapshots are shallow and optional, not a simulated social cognition layer.
- Rumor spread is represented as bounded known ids per NPC, not physical propagation through every room.
- Bark context uses pool identity in the existing `bark()` function instead of adding combat-system branching.

Exact Microseconds saved:
- Avoided global per-frame rumor scan: approximately 1024 NPCs * 60 frames * 5-20 us = 307,200-1,228,800 us/sec avoided on low-end hardware.
- Avoided `GameState`/save mutation and migration during talk: 0 us per frame and no save normalization cost.
- Static 70-entry rumor scan only on talk: estimated 20-70 us per interaction.
- Low-frequency memory tick: estimated 1-6 us per eligible NPC tick, staggered every 4 in-game minutes.
- Low-frequency rumor tick: estimated 1-5 us per eligible NPC tick, staggered every 7 in-game minutes.
- Bark override/cooldown: estimated 1-4 us per bark attempt, 0 us when no bark is attempted.

Verification:
- Baseline `npm run build` passed before AG09 edits.
- Post-implementation `npm run build` passed.
- Polish verification `npx tsc --noEmit` passed.

## 2026-05-17 Round 2

What was wrong:
- `observeRumorEvent()` could accept event-shaped facts, but published high-signal `WorldEvent`s did not actually feed ordinary NPC rumor memory.
- Event observation had no bounded recent-event bridge, so wiring it naively would have risked either a second bus or per-NPC event-history scans.
- Context dialogue did not react to new shipped systems such as contracts, containers, production, floor transitions, or theft memory.

What was done:
- Added a bounded event-to-rumor bridge: `systems/events.ts` forwards every published event to `recordRumorEvent()`, which stores only high-signal mappings in a 32-record module ring.
- Added talk-time absorption in `systems/rumor.ts`: an NPC checks at most 6 recent rumor events, filtered by floor, zone, privacy, and severity, then stores only rumor ids in existing bounded memory.
- Mapped samosbor zone capture, container theft, contract completion/failure, rare monster kills, fog boss kills, and floor transitions to static rumor ids.
- Published `floor_transition` events from lift travel and the Void portal in `main.ts`.
- Added 30 compact rumor definitions for economy, contracts, containers, Ministry access, Kvartiry unrest, Maintenance pressure, VOID, and event-backed facts; total rumor count is now 146.
- Added context snapshot flags and line pools for recent player theft, active contracts, nearby containers, nearby production rooms, and post-samosbor aftermath.
- Added trust/fear reaction polish using existing memory fields: theft increases hurt/fear; completed contracts and rare monster/fog boss kills increase helped/trust.
- Kept plot NPC scripted dialogue priority intact and kept empty-memory fallback behavior.
- Updated `README.md` and `Docs/Tasks/Status_AG09_RUMORS.md`.

Cinematic Cheats used:
- Event rumors are static ids plus tiny context slot filling, not generated text.
- NPCs learn from a bounded, relevance-filtered event ring only when spoken to.
- Floor transitions and theft use existing `WorldEvent`s and memory fields instead of adding save-critical social simulation.

Bounds:
- Recent event bridge: 32 records max.
- Per-talk event absorption: 6 records max.
- NPC memory: existing 1536 NPC cap and 12 known rumors per NPC.
- No per-frame event-history scans were added.

Verification:
- Baseline `npm run build` passed before Round 2 edits.
- `npm run typecheck` passed after edits.
- `npm run build` passed after edits.
- `npm run smoke` passed standalone after one interrupted `npm run check` smoke attempt.
- Final `npm run check` passed: typecheck, 26 unit tests, build, smoke (`hudLit=36864`, `webglLit=1024`).
