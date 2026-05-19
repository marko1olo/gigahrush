# Monster_35_MATKA_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing MATKA spawner boss safety owner.

<AGENT_PROMPT id="MONSTER_35_MATKA_AUDIT">
PROMPT IDENTIFIED: MONSTER_35_MATKA_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/matka.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/mancobus_room.ts`.
4. Create `Docs/Tasks/Status_MONSTER_35_MATKA_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_35_MATKA_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `MATKA` / **Матка** as spawner boss with kill-or-clear decision and safe caps.

## Absolute Write Scope

Owned:
- `src/entities/matka.ts`
- `Docs/Tasks/Status_MONSTER_35_MATKA_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_35_MATKA_AUDIT.md`
- Optional test: `tests/monster_35_matka_audit.test.ts`

Shared files, especially `src/systems/ai/monster.ts`, are read-only unless reassigned.

## Audit Contract

- Preserve role: rare spawner, room-plan decision.
- Do not change reproduction code unless explicitly reassigned.
- Counterplay should state: kill core fast or clear children first, not both slowly.
- Record cap/readability concerns in status/log.

## Implementation Tasks

1. Review local DEF and sprite.
2. Add/sharpen `counterplay` and `lootHint`.
3. Inspect current spawn cap behavior read-only and record whether it remains acceptable.
4. Run `npm run typecheck`.

## Done Means

- Матка's local definition teaches the room decision.
- No unapproved spawner logic changes.
</AGENT_PROMPT>
