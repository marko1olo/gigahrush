# Monster_47_NELYUD_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing NELYUD false-human owner.

<AGENT_PROMPT id="MONSTER_47_NELYUD_AUDIT">
PROMPT IDENTIFIED: MONSTER_47_NELYUD_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/nelyud.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/kvartiry/false_neighbor.ts`.
4. Create `Docs/Tasks/Status_MONSTER_47_NELYUD_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_47_NELYUD_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `NELYUD` / **Нелюдь** as false human close-reveal threat. It must support suspicion and distance-testing.

## Absolute Write Scope

Owned:
- `src/entities/nelyud.ts`
- `Docs/Tasks/Status_MONSTER_47_NELYUD_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_47_NELYUD_AUDIT.md`
- Optional test: `tests/monster_47_nelyud_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve close reveal identity.
- Do not make it permanently obvious at long range.
- Counterplay: keep distance, verify, bring witness/light, do not trust face.

## Implementation Tasks

1. Review `aiFlags`, stats, sprite corruption path.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Record if false-neighbor encounters need broader integration outside this file.
4. Run `npm run typecheck`.

## Done Means

- Нелюдь remains social horror with a combat payoff.
- It is not just another melee monster.
</AGENT_PROMPT>
