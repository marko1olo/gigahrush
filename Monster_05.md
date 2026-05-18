# Monster_05_Kartotechnik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: Ministry document-objective harassment owner.

<AGENT_PROMPT id="MONSTER_05_KARTOTECHNIK">
PROMPT IDENTIFIED: MONSTER_05_KARTOTECHNIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/ministry/inspection_archive.ts`
   - `src/gen/ministry/document_gate.ts`
   - `src/gen/ministry/admin_common.ts`
   - `src/entities/pechateed.ts`
   - `src/entities/paragraph.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_05_KARTOTECHNIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_05_KARTOTECHNIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `kartotechnik` / **Картотечник** as a Ministry archive encounter that relocates, guards or delays documents inside a bounded office setup. It should create route/time pressure, not delete quest progress.

## Absolute Write Scope

Owned:
- New source file: `src/gen/ministry/kartotechnik.ts`
- `Docs/Tasks/Status_MONSTER_05_KARTOTECHNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_05_KARTOTECHNIK.md`
- Optional focused test: `tests/monster_05_kartotechnik.test.ts`

Conditional integration:
- `src/gen/ministry/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not move global plot quest targets unless they are created and owned inside this module.
- Do not edit broad quest systems.
- Do not make documents permanently lost.

## Design Contract

- id: `kartotechnik`
- ru_name: `Картотечник`
- mode: A local POI using `PECHATEED`/`PARAGRAPH`; Mode B only later
- floors: `MINISTRY`, `raionsovet_archive`, `registry_morgue`
- room/context: filing room, drawer bank, inspection archive
- warning cue: drawers open in sequence, impossible alphabetical order, papers crawl toward cabinet
- counterplay: decoy `blank_form`, close drawer bank, burn wrong index, use permit, rush core shelf
- failure result: locally owned document/lead moves to nearby container; `PARAGRAPH` spawns; route gets one extra step
- reward/trace: `blank_form`, `ink_bottle`, `missing_record_file`
- event/rumor hook: tags `monster`, `documents`, `archive`, `relocated_objective`

## Implementation Tasks

1. Create a bounded Ministry archive room with one local objective item or clue.
2. Place `PECHATEED`/`PARAGRAPH` threats so document handling changes the fight.
3. Add one local relocation/delay mechanic for the module-owned item only.
4. Add a decoy or paper-based counterplay using existing items.
5. Publish event when the item is relocated, recovered, burned, or protected.
6. Validate that the route cannot softlock.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player loses certainty/time, not save integrity.
- Ministry combat becomes document-shaped.
- No broad quest mutation is introduced.
</AGENT_PROMPT>

<POLISH_MANDATE>
The archive should feel hostile through paperwork. Do not solve the task by spawning ordinary melee guards.
</POLISH_MANDATE>
