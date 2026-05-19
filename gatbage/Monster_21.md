# Monster_21_Ostavshiysya_Likvidator

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: corrupted liquidator non-kill encounter owner.

<AGENT_PROMPT id="MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR">
PROMPT IDENTIFIED: MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/defector_liquidator.ts`
   - `src/gen/ministry/liquidator_archive.ts`
   - `src/data/relations.ts`
   - `src/systems/factions.ts`
   - `src/systems/ai/combat.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `ostavshiysya_likvidator` / **Оставшийся Ликвидатор** as a post-cleanup armed human-like encounter with help/disarm/flee/kill/report decisions. Prefer NPC/faction systems over new `MonsterKind`.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/ostavshiysya_likvidator.ts`
- `Docs/Tasks/Status_MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR.md`
- `Docs/AgentLogs/LOG_MONSTER_21_OSTAVSHIYSYA_LIKVIDATOR.md`
- Optional focused test: `tests/monster_21_ostavshiysya_likvidator.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add new faction systems.
- Do not make a new `MonsterKind` unless an integrator explicitly changes this prompt.
- Do not create instant hitscan death.

## Design Contract

- id: `ostavshiysya_likvidator`
- ru_name: `Оставшийся Ликвидатор`
- mode: A NPC/monster encounter
- floors: post-samosbor `LIVING`, `MAINTENANCE`, liquidator floors, `HELL` threshold
- room/context: failed cleanup post, broken respirator, sealed checkpoint
- warning cue: wrong cleanup code, broken mask, weapon held too steady, bad radio line
- counterplay: talk from distance, show permit, throw med item, flank after reload, use cover, report
- failure result: ranged burst, reputation hit, liquidator hostility if killed publicly
- reward/trace: ammo, `gasmask_filter`, liquidator rumor, moral debt
- event/rumor hook: tags `monster`, `liquidator`, `aftermath`, `nonkill`

## Implementation Tasks

1. Create a small Maintenance cleanup-failure checkpoint.
2. Spawn one armed liquidator-like NPC with clear warning barks and cover geometry.
3. Add at least two non-kill outcomes: aid, disarm, report, retreat, or proof handoff.
4. If combat happens, make reload/cover readable and not instantly lethal.
5. Publish event for aided, disarmed, killed, reported, or escaped outcomes.
6. Make loot useful but socially risky if taken by force.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player can solve it without murder.
- Killing gives loot but leaves social/event consequences.
- It feels like a failed cleanup story, not a generic bandit.
</AGENT_PROMPT>

<POLISH_MANDATE>
Keep the ambiguity. The player should ask whether this is a monster, a casualty, or a liability.
</POLISH_MANDATE>
