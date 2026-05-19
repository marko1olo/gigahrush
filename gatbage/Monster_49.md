# Monster_49_KOSTOREZ_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing KOSTOREZ elite windup owner.

<AGENT_PROMPT id="MONSTER_49_KOSTOREZ_AUDIT">
PROMPT IDENTIFIED: MONSTER_49_KOSTOREZ_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source:
   - `src/entities/kostorez.ts`
   - `src/entities/monster.ts`
   - `src/data/monster_ecology.ts`
   - `src/systems/ai/monster.ts`
   - `src/gen/maintenance/kostorez_locker.ts`
4. Create `Docs/Tasks/Status_MONSTER_49_KOSTOREZ_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_49_KOSTOREZ_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `KOSTOREZ` / **Косторез** as elite readable windup melee threat. Preserve shotgun stagger, obstacle/distance counterplay, and armor-sheet interaction.

## Absolute Write Scope

Owned:
- `src/entities/kostorez.ts`
- `Docs/Tasks/Status_MONSTER_49_KOSTOREZ_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_49_KOSTOREZ_AUDIT.md`
- Optional test: `tests/monster_49_kostorez_audit.test.ts`

Shared files, especially `src/systems/ai/monster.ts`, are read-only unless reassigned.

## Audit Contract

- Preserve role: elite windup, not surprise one-shot.
- Do not remove readable windup or shotgun stagger.
- Counterplay must mention distance, corner/column, shotgun, metal sheet.

## Implementation Tasks

1. Review local DEF and sprite.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Read AI windup branch and record any fairness issues in status/log.
4. Run `npm run typecheck`; run `npm run check` only if assigned broader behavior.

## Done Means

- Косторез remains dangerous but readable.
- No unapproved elite AI edits.
</AGENT_PROMPT>
