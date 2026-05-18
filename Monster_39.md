# Monster_39_CREATOR_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing CREATOR final boss integrity owner.

<AGENT_PROMPT id="MONSTER_39_CREATOR_AUDIT">
PROMPT IDENTIFIED: MONSTER_39_CREATOR_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/creator.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/gen/void/index.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_39_CREATOR_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_39_CREATOR_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `CREATOR` / **Творец** as final Void boss. Do not casually rebalance final progression; focus on local definition clarity and counterplay text.

## Absolute Write Scope

Owned:
- `src/entities/creator.ts`
- `Docs/Tasks/Status_MONSTER_39_CREATOR_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_39_CREATOR_AUDIT.md`
- Optional test: `tests/monster_39_creator_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve final boss identity.
- Do not nerf or buff final fight without explicit design reason.
- Counterplay: full supplies, cover between volleys, do not spend movement without exit.

## Implementation Tasks

1. Review DEF and local sprite.
2. Add/sharpen `counterplay`, `lootHint`, `floors` if missing.
3. Record any final fight readability concerns in status/log, not generator edits.
4. Run `npm run typecheck`.

## Done Means

- Творец definition communicates final boss expectations.
- No final-route or victory behavior is touched.
</AGENT_PROMPT>
