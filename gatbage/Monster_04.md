# Monster_04_Pustoy_Sosed

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: conditional false-neighbor reveal owner.

<AGENT_PROMPT id="MONSTER_04_PUSTOY_SOSED">
PROMPT IDENTIFIED: MONSTER_04_PUSTOY_SOSED | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/kvartiry/false_neighbor.ts`
   - `src/gen/living/external_cell_neighbor.ts`
   - `src/entities/nelyud.ts`
   - `src/systems/npc_memory.ts`
   - `src/systems/events.ts`
   - `src/data/rumors.ts`
4. Create `Docs/Tasks/Status_MONSTER_04_PUSTOY_SOSED.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_04_PUSTOY_SOSED.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `pustoy_sosed` / **Пустой Сосед** as a social false-neighbor setup that can be exposed or avoided before a close reveal. It extends `NELYUD` through local conditions, not broad NPC AI.

## Absolute Write Scope

Owned:
- New source file: `src/gen/kvartiry/pustoy_sosed.ts`
- `Docs/Tasks/Status_MONSTER_04_PUSTOY_SOSED.md`
- `Docs/AgentLogs/LOG_MONSTER_04_PUSTOY_SOSED.md`
- Optional focused test: `tests/monster_04_pustoy_sosed.test.ts`

Conditional integration:
- `src/gen/kvartiry/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not modify broad NPC FSM.
- Do not make all civilians suspect by default.
- Do not add new reputation systems.

## Design Contract

- id: `pustoy_sosed`
- ru_name: `Пустой Сосед`
- mode: A, local named NPC that can spawn/reveal `NELYUD`
- floors: `KVARTIRY`, `LIVING`, `registry_morgue` later
- room/context: wrong apartment, neighbor dispute, registry mismatch
- warning cue: name mismatch, wrong apartment number, no reflection in screen/log, nearby NPCs avoid him
- counterplay: keep distance, ask for document, bring witness, lead to lit public room, report to liquidator
- failure result: close reveal into `NELYUD`/fast melee and black slime trace
- reward/trace: `fake_pass`, complaint note, exposed-infected event
- event/rumor hook: tags `monster`, `false_neighbor`, `witness`, `infected`

## Implementation Tasks

1. Create a local Kvartiry false-neighbor scene with one suspect NPC and one witness/evidence cue.
2. Make the suspect non-hostile until a clear local condition is met.
3. Add at least one expose path that prevents or weakens the reveal.
4. On failure, spawn or transform into an existing `NELYUD`-style threat.
5. Publish event data for exposed, ignored, or revealed outcomes.
6. Keep all state local to the POI or compact event data.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Player has clues before reveal.
- Bringing a witness or checking papers matters.
- No broad social simulation rewrite is required.
</AGENT_PROMPT>

<POLISH_MANDATE>
The point is suspicion and verification. If the player can only discover the neighbor by taking damage, the design failed.
</POLISH_MANDATE>
