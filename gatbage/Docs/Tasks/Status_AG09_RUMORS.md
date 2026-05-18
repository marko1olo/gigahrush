# AG09 Rumors / Memory / A-Life Status

Agent: AGENT_09_RUMORS_MEMORY_ALIFE
Domain: NPC Memory / Rumors / Context Dialogue
Task count: 14

## Preflight

- [x] Extracted only `<AGENT_PROMPT id="AGENT_09_RUMORS_MEMORY_ALIFE">` via CLI from `Docs/AgentPrompts/AGENT_09_RUMORS_MEMORY_ALIFE.md`.
- [x] Read `README.md`.
- [x] Read `desdoc.md` sections 7, 73, 74, 75, 77.
- [x] Read required files: `src/data/dialogue.ts`, `src/systems/ai/barks.ts`, `src/systems/ai/npc_fsm.ts`, `src/systems/ai/index.ts`, `src/systems/needs.ts`, `src/systems/quests.ts`, `src/core/types.ts`.
- [x] Baseline build: `npm run build` passed before AG09 edits.
- [x] Registry check: local `.agents-skills/`, repo `AGENTS.md`, and `Docs/Actual Domains of Project.txt` are absent in this checkout. Using prompt-selected mandates plus `desdoc.md` sections as binding technical source.

## Selected Mandates

1. NPC context must be cheap and cooldowned.
2. Rumors are fallible local knowledge, not omniscience.
3. Do not require AG01 events; optional compatibility only.
4. No giant generated text dumps in code paths.
5. Keep memory bounded outside `GameState` unless unavoidable.
6. Plot NPC scripted lines retain priority over generated context.

## Checklist

- [x] 1. Map current dialogue and bark generation.
- [x] 2. Add rumor definitions and reveal types, at least 60 definitions.
- [x] 3. Add `ContextSnapshot` builder.
- [x] 4. Add bounded `NpcMemory` store.
- [x] 5. Add rumor selection/remembrance/decay.
- [x] 6. Modify `generateTalkText()` with plot priority and context fallback.
- [x] 7. Add context line pools.
- [x] 8. Add low-frequency NPC FSM hook.
- [x] 9. Add combat/bark context pools without per-frame allocations.
- [x] 10. Optional AG01 event compatibility or documented deferral.
- [x] 11. Avoid repeated HUD strings; bark cooldowns preserved.
- [x] 12. README factual update.
- [x] 13. Build and fix AG09-owned errors.
- [x] 14. Record five context examples and resulting lines.

## Iteration Log

### Loop 0 - Preflight

- DOD practice: CLI extraction, required-doc scan, baseline compile.
- Rejected alternative: editing from prompt memory without current code read; unsafe under parallel agent edits.
- Build: baseline `npm run build` passed.
- Microsecond estimate: implementation not measured yet; target overhead is sub-0.1 ms via interaction-time generation and multi-minute FSM hooks.

### Loop 1 - Tasks 1-5

- Task 1: Current talk is `generateTalkText(npc)` from `main.ts`; barks flow through `bark()` from combat, pathfinding, and NPC FSM. DOD: direct `rg` mapping. Rejected alternative: touching `main.ts` outside scope. Estimate: 0 us runtime.
- Task 2: Added 70 static `RumorDef` entries in `src/data/rumors.ts` across samosbor, rare item, faction, room, monster, floor, and player-action topics. DOD: `rg -o "id: '" src/data/rumors.ts | wc -l` = 70. Rejected alternative: generated text blobs. Estimate: 0 us per frame; static module data only.
- Task 3: Added `buildContextSnapshot()` in `src/systems/context.ts` for floor, zone, room, NPC state, player distance, needs, HP, and samosbor flags when callers provide data. DOD: optional inputs and safe NPC-only fallback. Rejected alternative: mandatory `GameState` edit. Estimate: 5-25 us on interaction, 0 us per frame unless called.
- Task 4: Added bounded module-level `NpcMemory` store in `src/systems/npc_memory.ts`, capped at 1536 NPCs and 12 rumors per NPC. DOD: bounded map, bounded rumor arrays, decay. Rejected alternative: storing memory on `Entity`/save. Estimate: 1-8 us on touched NPC.
- Task 5: Added `src/systems/rumor.ts` for context/trust/floor rumor selection, memory, cooldown, and event-like optional observation. DOD: no runtime import from AG01 events. Rejected alternative: omniscient global rumor feed. Estimate: 20-70 us on talk only.
- Build: `npm run build` passed after Tasks 1-5 and incidental wiring.

### Loop 2 - Tasks 6-11

- Task 6: `generateTalkText()` keeps pre-plot scripted dialogue first and post-plot lines at 75% priority, with context/rumors only as fallback enrichment. DOD: plot branch still returns before generic context for active plot NPCs. Rejected alternative: replacing plot text. Estimate: 20-100 us per talk.
- Task 7: Added context line pools for hunger, thirst, wound, dangerous zone, safe own zone, aftermath fear, low trust, high trust, occupation, and faction. DOD: pools in `src/data/context_lines.ts`. Rejected alternative: growing `dialogue.ts` with ad hoc strings. Estimate: 0 us per frame.
- Task 8: Added `tickNpcMemoryLowFrequency()` call in `npc_fsm.ts`, staggered to every 4 in-game minutes per NPC. DOD: hook uses existing update path and does not allocate. Rejected alternative: per-frame context scan. Estimate: 1-6 us only on staggered tick.
- Task 9: Added context-aware bark pool override for wounded/fear/faction in `barks.ts`. DOD: existing `bark()` callers benefit without combat module edits. Rejected alternative: editing combat outside AG09 scope. Estimate: 1-3 us per bark attempt.
- Task 10: Added `observeRumorEvent()` with import-free event-like shape. DOD: can accept AG01-shaped event data without depending on `publishEvent`. Rejected alternative: hard import from `events.ts`. Estimate: 2-8 us when called.
- Task 11: Added bounded per-entity bark dedupe/cooldown map in `barks.ts`. DOD: prevents same-line spam and caps entries at 1536. Rejected alternative: storing bark state on entities. Estimate: 1-4 us per bark attempt.

### Loop 3 - Tasks 12-14

- Task 12: README updated with factual section for NPC memory, context snapshots, and 70 static rumors. DOD: concise docs after implementation. Rejected alternative: speculative architecture prose. Estimate: 0 us runtime.
- Task 13: Build verification after README and hook changes: `npm run build` passed; `npx tsc --noEmit` passed. Rejected alternative: claiming Vite transform as full type check. Estimate: 0 us runtime.
- Task 14: Five examples recorded below. DOD: examples map directly to implemented pools/selection. Rejected alternative: screenshots or UI-only proof unavailable in this CLI pass. Estimate: 0 us runtime.

### Loop 4 - Self-Read Polish

- Re-read AG09 prompt after third task block with CLI extraction.
- Re-read `src/systems/rumor.ts`, `src/systems/context.ts`, and `src/systems/npc_memory.ts`.
- Found and fixed gap: FSM hook updated memory but did not seed rumor knowledge. Added `tickNpcRumorLowFrequency()` and wired it beside memory tick.
- Verified no new global per-frame entity scan was added by AG09. Existing `forceHide()` loop predates AG09 and is only called by samosbor.

### Loop 5 - Polish Mandate

- Read `<POLISH_MANDATE>` only after all core tasks were implemented.
- Trim check: rumor text remains compact one/two-line static entries; no runtime generated text dump added.
- Per-frame scan check: AG09 added no global scan; memory/rumor ticks are per-NPC inside existing FSM and staggered by in-game minute.
- Empty-memory fallback check: `generateTalkText(npc)` creates bounded memory on demand, can return context line, rumor, state line, then generic pool without requiring stored memory.
- Final verification: `npm run build` passed; `npx tsc --noEmit` passed.

## Five Context Examples

1. Hungry ordinary NPC: `needs.food = 12` -> `Сначала хлеб, потом разговоры.`
2. Wounded ordinary NPC: `hp/maxHp < 0.5` -> `Меня задело. Нужен бинт, не философия.`
3. Dangerous zone snapshot: `zoneLevel >= 6` or samosbor zone -> `Слишком тихо. Тут либо все ушли, либо все уже рядом.`
4. Low trust memory: `trustPlayer < -25` -> `Я тебя не знаю. Этого достаточно.`
5. Empty memory, no urgent context: rumor fallback can select room/faction/floor rumor, e.g. `Пустая кухня хуже коридора. Коридор хотя бы не обещает.`

## Round 2

- [x] Extracted `<AGENT_PROMPT id="AGENT_09_RUMORS_MEMORY_ALIFE">` from `Docs/AgentPrompts/AGENT_09_RUMORS_MEMORY_ALIFE.md`.
- [x] Re-read `README.md`, `architecture.md`, `src/data/rumors.ts`, `src/data/context_lines.ts`, `src/systems/context.ts`, `src/systems/npc_memory.ts`, `src/systems/rumor.ts`, `src/data/dialogue.ts`, `src/systems/events.ts`, and `src/systems/ai/npc_fsm.ts`.
- [x] Baseline `npm run build` passed before Round 2 edits.
- [x] Added bounded event-to-rumor bridge in `publishEvent()` -> `recordRumorEvent()` for high-signal facts only.
- [x] Added bridge mappings for samosbor zone capture, container theft, contract completion/failure, rare monster/fog boss kills, and floor transitions.
- [x] Added lift/Void `floor_transition` event publication so floor changes can enter the same event store.
- [x] Kept observation bounded: module-level rumor-event ring cap 32, max 6 records absorbed per talk, floor/zone/privacy relevance checks.
- [x] Added 30 compact rumor defs for economy, contracts, containers, Ministry access, Kvartiry unrest, Maintenance pressure, VOID, and event-backed facts. Total `RumorDef` count: 146.
- [x] Added context signals/lines for recent theft, active contracts, nearby production, nearby containers, and post-samosbor aftermath.
- [x] Added trust/fear reactions through existing memory fields: theft raises fear/hurt, completed contracts/rare kills raise help/trust.
- [x] Preserved plot dialogue priority: active plot `talkLines` still return before context/rumor fallback.
- [x] Empty-memory proof remains valid: `generateTalkText()` creates memory on demand and falls back to context, rumor, state text, then generic lines.
- [x] README updated with shipped event-backed rumor behavior.

### Round 2 Verification

- `npm run build` passed before edits.
- `npm run typecheck` passed after edits.
- `npm run build` passed after edits.
- `npm run smoke` passed standalone after an interrupted first `npm run check` smoke attempt.
- Final `npm run check` passed: typecheck, 26 unit tests, build, smoke (`hudLit=36864`, `webglLit=1024`).
