# Monster_32_NIGHTMARE_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing NIGHTMARE rare pressure owner.

<AGENT_PROMPT id="MONSTER_32_NIGHTMARE_AUDIT">
PROMPT IDENTIFIED: MONSTER_32_NIGHTMARE_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/nightmare.ts`, `src/entities/procedural_visuals.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_32_NIGHTMARE_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_32_NIGHTMARE_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `NIGHTMARE` / **Кошмарище** as a rare pressure enemy: burst-or-flee, punishes hesitation, not a common melee sponge.

## Absolute Write Scope

Owned:
- `src/entities/nightmare.ts`
- `Docs/Tasks/Status_MONSTER_32_NIGHTMARE_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_32_NIGHTMARE_AUDIT.md`
- Optional test: `tests/monster_32_nightmare_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve rare status and psychological pressure.
- Avoid making it a normal common spawn.
- Counterplay must be decisive: high damage quickly or leave.

## Implementation Tasks

1. Review stats against elite tier.
2. Add/sharpen `counterplay`, `lootHint`, floor identity in local DEF if absent.
3. Keep sprite visually distinct from Shadow/Spirit.
4. Run `npm run typecheck`.

## Done Means

- Кошмарище is rare, clear, and scary for a rule.
- No shared spawn table edits.
</AGENT_PROMPT>
