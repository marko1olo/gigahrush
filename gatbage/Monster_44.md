# Monster_44_PECHATEED_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing PECHATEED document-hunter owner.

<AGENT_PROMPT id="MONSTER_44_PECHATEED_AUDIT">
PROMPT IDENTIFIED: MONSTER_44_PECHATEED_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/pechateed.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/ministry/inspection_archive.ts`.
4. Create `Docs/Tasks/Status_MONSTER_44_PECHATEED_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_44_PECHATEED_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `PECHATEED` / **Печатеед** as document hunter. It should punish paper carriers but remain kiteable and understandable.

## Absolute Write Scope

Owned:
- `src/entities/pechateed.ts`
- `Docs/Tasks/Status_MONSTER_44_PECHATEED_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_44_PECHATEED_AUDIT.md`
- Optional test: `tests/monster_44_pechateed_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve document scent identity.
- Do not modify document-targeting AI unless assigned.
- Counterplay: drop/avoid carrying extra papers, kite, keep distance.

## Implementation Tasks

1. Review local `aiFlags`, stats and sprite.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Compare text to current document-like item detection read-only.
4. Run `npm run typecheck`.

## Done Means

- Печатеед makes documents tactically meaningful.
- No broad inventory scan changes.
</AGENT_PROMPT>
