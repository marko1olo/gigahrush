# Monster_46_PARAGRAPH_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing PARAGRAPH ranged document enemy owner.

<AGENT_PROMPT id="MONSTER_46_PARAGRAPH_AUDIT">
PROMPT IDENTIFIED: MONSTER_46_PARAGRAPH_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/paragraph.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/ministry/document_gate.ts`, `src/gen/void/protocol_chamber.ts`.
4. Create `Docs/Tasks/Status_MONSTER_46_PARAGRAPH_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_46_PARAGRAPH_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `PARAGRAPH` / **Параграф** as ranged hostile document: medium-distance danger, line-of-sight break, close/rush after shot.

## Absolute Write Scope

Owned:
- `src/entities/paragraph.ts`
- `Docs/Tasks/Status_MONSTER_46_PARAGRAPH_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_46_PARAGRAPH_AUDIT.md`
- Optional test: `tests/monster_46_paragraph_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve Ministry/Void bureaucratic ranged identity.
- Do not make it duplicate Eye exactly.
- Counterplay: break sight and close, use documents/office geometry if local encounter supports it.

## Implementation Tasks

1. Review ranged fields, `aiFlags`, stats.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Improve local projectile/sprite cue only if contained in entity file.
4. Run `npm run typecheck`.

## Done Means

- Параграф is paper/legal horror, not just another eye bolt.
- Its range rule is clear.
</AGENT_PROMPT>
