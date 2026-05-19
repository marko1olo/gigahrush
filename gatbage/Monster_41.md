# Monster_41_ROBOT_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing ROBOT ranged machine owner.

<AGENT_PROMPT id="MONSTER_41_ROBOT_AUDIT">
PROMPT IDENTIFIED: MONSTER_41_ROBOT_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/robot.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_41_ROBOT_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_41_ROBOT_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `ROBOT` / **Робот** as industrial ranged machine: dodge volley, attack after shot, electronic loot identity.

## Absolute Write Scope

Owned:
- `src/entities/robot.ts`
- `Docs/Tasks/Status_MONSTER_41_ROBOT_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_41_ROBOT_AUDIT.md`
- Optional test: `tests/monster_41_robot_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve industrial ranged identity.
- Do not make it a flesh monster with robot name.
- Counterplay: dodge line/plasma and punish after volley.

## Implementation Tasks

1. Review ranged fields and sprite readability.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Record desired projectile feedback changes in status/log only.
4. Run `npm run typecheck`.

## Done Means

- Робот reads as mechanical and fair.
- It remains distinct from Eye/Paragraph.
</AGENT_PROMPT>
