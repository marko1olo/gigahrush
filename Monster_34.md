# Monster_34_REBAR_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing REBAR metal mimic readability owner.

<AGENT_PROMPT id="MONSTER_34_REBAR_AUDIT">
PROMPT IDENTIFIED: MONSTER_34_REBAR_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/rebar.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/gen/design_floors/production_belt.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_34_REBAR_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_34_REBAR_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `REBAR` / **Арматура** as inorganic metal/storage threat, not generic mimic loot.

## Absolute Write Scope

Owned:
- `src/entities/rebar.ts`
- `Docs/Tasks/Status_MONSTER_34_REBAR_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_34_REBAR_AUDIT.md`
- Optional test: `tests/monster_34_rebar_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve role: metal production/storage threat.
- Counterplay: avoid flat iron near shelves, attack from distance, do not punch metal.
- Do not duplicate corpse/loot mimic roles from new `samosbornyy_ostov`.

## Implementation Tasks

1. Review stats and sprite readability as hostile rebar.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Record desired production placement fixes in status/log if outside entity file.
4. Run `npm run typecheck`.

## Done Means

- Арматура is visually and tactically metal.
- Its counterplay differs from organic ambushes.
</AGENT_PROMPT>
