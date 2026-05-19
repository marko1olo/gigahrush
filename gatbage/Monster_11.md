# Monster_11_Myasomer

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: post-samosbor noise predator encounter owner.

<AGENT_PROMPT id="MONSTER_11_MYASOMER">
PROMPT IDENTIFIED: MONSTER_11_MYASOMER | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/systems/samosbor.ts`
   - `src/systems/samosbor_director.ts`
   - `src/systems/audio.ts`
   - `src/entities/shadow.ts`
   - `src/entities/sborka.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_11_MYASOMER.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_11_MYASOMER.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `myasomer` / **Мясомер** as a post-samosbor noise predator setup. First version should be staged and local. Build a generic noise marker system only if an integrator explicitly assigns that hook.

## Absolute Write Scope

Owned:
- New source file: `src/gen/hell/myasomer.ts`
- `Docs/Tasks/Status_MONSTER_11_MYASOMER.md`
- `Docs/AgentLogs/LOG_MONSTER_11_MYASOMER.md`
- Optional focused test: `tests/monster_11_myasomer.test.ts`

Conditional integration:
- `src/gen/hell/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not implement broad acoustic simulation.
- Do not scan all recent sounds unless using an approved capped marker hook.
- Do not make firing globally punish the player everywhere.

## Design Contract

- id: `myasomer`
- ru_name: `Мясомер`
- mode: A staged encounter; C noise hook only if assigned
- floors: post-samosbor non-VOID floors, `HELL`
- room/context: raw-meat aftermath corridor, siren shard room, post-samosbor sealed hall
- warning cue: wall heartbeat, meat smell intensifies after local loud action, HUD/log line
- counterplay: stop firing, walk away, close slowly, throw bait/noise, use route with cover
- failure result: local `SHADOW`/`SBORKA` pressure after repeated loud triggers
- reward/trace: `siren_shard`, `rawmeat`, aftermath rumor
- event/rumor hook: tags `monster`, `noise`, `samosbor_aftermath`, `meat`

## Implementation Tasks

1. Create a small Hell or aftermath-themed room that demonstrates noise discipline.
2. Define local "loud" triggers only inside the encounter, such as shooting a marked object, bashing a door, or looting a siren shard.
3. Add escalating warnings before spawn.
4. Spawn a capped threat using existing monsters after repeated local triggers.
5. Add a quiet resolution path that preserves resources or improves reward.
6. Publish events for warned, triggered, quiet-clear, and loud-clear outcomes.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Silence becomes a tactic in one readable encounter.
- Noise response is local and capped.
- No global sound system is added.
</AGENT_PROMPT>

<POLISH_MANDATE>
Do not punish ordinary combat across the game. This task teaches a local rule for future reuse.
</POLISH_MANDATE>
