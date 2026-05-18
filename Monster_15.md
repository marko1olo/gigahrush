# Monster_15_Samosbornyy_Ostov

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: post-samosbor corpse/loot risk owner.

<AGENT_PROMPT id="MONSTER_15_SAMOSBORNYY_OSTOV">
PROMPT IDENTIFIED: MONSTER_15_SAMOSBORNYY_OSTOV | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/living/hospital_quarantine.ts`
   - `src/gen/design_floors/registry_morgue.ts`
   - `src/gen/carnivorous_fungus_room.ts`
   - `src/entities/zombie.ts`
   - `src/entities/shadow.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_15_SAMOSBORNYY_OSTOV.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_15_SAMOSBORNYY_OSTOV.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `samosbornyy_ostov` / **Самосборный Остов** as a corpse/loot-risk aftermath encounter. It should warn the player before looting and avoid making every corpse dangerous.

## Absolute Write Scope

Owned:
- New source file: `src/gen/living/samosbornyy_ostov.ts`
- `Docs/Tasks/Status_MONSTER_15_SAMOSBORNYY_OSTOV.md`
- `Docs/AgentLogs/LOG_MONSTER_15_SAMOSBORNYY_OSTOV.md`
- Optional focused test: `tests/monster_15_samosbornyy_ostov.test.ts`

Conditional integration:
- `src/gen/living/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not globally alter item drops or corpse behavior.
- Do not duplicate `REBAR` metal mimic gameplay.
- Do not punish ordinary looting everywhere.

## Design Contract

- id: `samosbornyy_ostov`
- ru_name: `Самосборный Остов`
- mode: A local loot-risk encounter
- floors: post-samosbor rooms, hospital, registry morgue, `HELL`
- room/context: aftermath corpse, too-clean loot, quarantine bed, morgue index
- warning cue: corpse breathes dust, flies avoid it, loot looks too clean, log clue
- counterplay: poke/shoot from distance, scan via rumor, burn corpse, leave for liquidators
- failure result: close ambush or black slime splash using `ZOMBIE`/`SHADOW`
- reward/trace: `note`, `rawmeat`, `bandage`, rare `samosbor_tally`
- event/rumor hook: tags `monster`, `corpse`, `aftermath`, `loot_risk`

## Implementation Tasks

1. Create one local aftermath corpse scene with visible warnings.
2. Put the reward close enough to tempt but not require risky interaction.
3. Trigger a bounded existing-monster ambush only on deliberate disturbance.
4. Add a safe disposal or report path.
5. Publish event for disturbed, burned, reported, or safely looted outcomes.
6. Ensure no existing corpse system is modified globally.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player learns to inspect suspicious aftermath loot.
- One corpse is dangerous for a reason; all corpses are not.
- The encounter leaves evidence or a rumor.
</AGENT_PROMPT>

<POLISH_MANDATE>
The corpse must invite a greedy decision. If it is just a hidden spawn, add a warning and a safe option.
</POLISH_MANDATE>
