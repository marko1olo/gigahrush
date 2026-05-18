# Monster_23_Matka_Dokumentov

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: Ministry paper-boss room puzzle owner.

<AGENT_PROMPT id="MONSTER_23_MATKA_DOKUMENTOV">
PROMPT IDENTIFIED: MONSTER_23_MATKA_DOKUMENTOV | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/ministry/stamp_room.ts`
   - `src/gen/ministry/permit_office.ts`
   - `src/gen/ministry/refusal_clause.ts`
   - `src/entities/paragraph.ts`
   - `src/entities/pechateed.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_23_MATKA_DOKUMENTOV.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_23_MATKA_DOKUMENTOV.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `matka_dokumentov` / **Матка Документов** as a stationary Ministry boss room that spawns or empowers paper threats until the player handles stamps/files. It must have a paper/document solution, not just bullets.

## Absolute Write Scope

Owned:
- New source file: `src/gen/ministry/matka_dokumentov.ts`
- `Docs/Tasks/Status_MONSTER_23_MATKA_DOKUMENTOV.md`
- `Docs/AgentLogs/LOG_MONSTER_23_MATKA_DOKUMENTOV.md`
- Optional focused test: `tests/monster_23_matka_dokumentov.test.ts`

Conditional integration:
- `src/gen/ministry/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not modify generic `MATKA` reproduction.
- Do not add unlimited paper spawns.
- Do not break global document quests.

## Design Contract

- id: `matka_dokumentov`
- ru_name: `Матка Документов`
- mode: A local boss room; B only if reused across Ministry
- floors: `MINISTRY`, `raionsovet_archive`, `upper_bureau`
- room/context: archive boss desk, stamp room, refusal clause nest
- warning cue: crawling forms, stamp hits without hand, cabinets breathing paper
- counterplay: burn wrong stack, stamp cancellation form, close cabinets, rush core, use decoy blank forms
- failure result: capped `PARAGRAPH`/`PECHATEED` pressure, document delay, forced office route
- reward/trace: `unsigned_order`, `blank_form`, `psi_order_seal`
- event/rumor hook: tags `monster`, `documents`, `boss`, `ministry`

## Implementation Tasks

1. Create a local Ministry room with one central paper anchor.
2. Add 2-3 document/stamp interactions that weaken or disable the anchor.
3. Spawn at most 3-5 active paper threats at a time.
4. Add at least one document-based shortcut or non-DPS solution.
5. Publish events for anchor awakened, form cancelled, boss cleared, or document delay.
6. Validate that all module-owned objectives remain recoverable.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Ministry combat is shaped by paperwork.
- Boss phase ends through room actions, not only damage.
- Spawn count is capped and local.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the best strategy is just shooting a pile of HP, add a stamp/file interaction before polishing.
</POLISH_MANDATE>
