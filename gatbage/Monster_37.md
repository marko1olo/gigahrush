# Monster_37_MANCOBUS_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing MANCOBUS controller boss owner.

<AGENT_PROMPT id="MONSTER_37_MANCOBUS_AUDIT">
PROMPT IDENTIFIED: MONSTER_37_MANCOBUS_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/mancobus.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/gen/maintenance/mancobus_room.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_37_MANCOBUS_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_37_MANCOBUS_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `MANCOBUS` / **Манкобус** as controller boss: clear guards, use corners, avoid direct sector.

## Absolute Write Scope

Owned:
- `src/entities/mancobus.ts`
- `Docs/Tasks/Status_MONSTER_37_MANCOBUS_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_37_MANCOBUS_AUDIT.md`
- Optional test: `tests/monster_37_mancobus_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve boss/controller identity.
- Do not make it common.
- Counterplay must involve guards and corners, not pure DPS.

## Implementation Tasks

1. Review stats and ranged fields.
2. Add/sharpen local `counterplay`, `lootHint`, `floors`.
3. Record any room-encounter placement concerns in status/log.
4. Run `npm run typecheck`.

## Done Means

- Манкобус reads as boss/controller before the fight.
- No unapproved generator or AI edits.
</AGENT_PROMPT>
