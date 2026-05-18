# Monster_13_Belaya_Prislushka

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: white slime compulsion and escort-risk owner.

<AGENT_PROMPT id="MONSTER_13_BELAYA_PRISLUSHKA">
PROMPT IDENTIFIED: MONSTER_13_BELAYA_PRISLUSHKA | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/living/white_compulsion_room.ts`
   - `src/gen/living/hospital_quarantine.ts`
   - `src/data/slime_defs.ts`
   - `src/systems/status.ts`
   - `src/systems/events.ts`
   - `src/systems/ai/npc_fsm.ts`
4. Create `Docs/Tasks/Status_MONSTER_13_BELAYA_PRISLUSHKA.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_13_BELAYA_PRISLUSHKA.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `belaya_prislushka` / **Белая Прислушка** as a local white-slime compulsion setup that pressures an NPC or witness toward danger. This is an escort/triage decision, not a new broad NPC behavior system.

## Absolute Write Scope

Owned:
- New source file: `src/gen/living/belaya_prislushka.ts`
- `Docs/Tasks/Status_MONSTER_13_BELAYA_PRISLUSHKA.md`
- `Docs/AgentLogs/LOG_MONSTER_13_BELAYA_PRISLUSHKA.md`
- Optional focused test: `tests/monster_13_belaya_prislushka.test.ts`

Conditional integration:
- `src/gen/living/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not rewrite NPC FSM.
- Do not add a global mind-control system.
- Do not make the NPC loss unavoidable.

## Design Contract

- id: `belaya_prislushka`
- ru_name: `Белая Прислушка`
- mode: A local NPC/room rule
- floors: `LIVING`, hospital rooms, communal shelters
- room/context: white slime residue, quarantine/triage corner, shelter door
- warning cue: NPC repeats one phrase, residue points toward door, screen/log asks for quiet
- counterplay: break line of sight, escort NPC away, cover/burn source, use antidep/psi support if existing, close door
- failure result: NPC opens/approaches danger, small monster spawns, reputation or reward loss
- reward/trace: `slime_sample_white`, `antidep`, scientist/cult event
- event/rumor hook: tags `monster`, `slime_white`, `compulsion`, `rescue`

## Implementation Tasks

1. Create a local room with one at-risk NPC and a visible white slime source.
2. Add a clear timer or staged warning before the NPC reaches danger.
3. Provide at least one rescue action and one risky sample action.
4. Spawn a small existing monster only on failure or risky harvest.
5. Publish event for rescued, lost, sampled, and source-cleared outcomes.
6. Keep any NPC movement local and simple; avoid broad FSM edits.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player can save someone without killing the source.
- White slime creates a social/escort problem.
- No global compulsion system is added.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the NPC walks into danger with no warning or rescue window, slow it down and add cues.
</POLISH_MANDATE>
