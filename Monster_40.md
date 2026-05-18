# Monster_40_SPIRIT_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing SPIRIT phasing threat owner.

<AGENT_PROMPT id="MONSTER_40_SPIRIT_AUDIT">
PROMPT IDENTIFIED: MONSTER_40_SPIRIT_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/spirit.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_40_SPIRIT_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_40_SPIRIT_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `SPIRIT` / **Дух** as phasing threat: walls/doors do not solve it, distance and repositioning do.

## Absolute Write Scope

Owned:
- `src/entities/spirit.ts`
- `Docs/Tasks/Status_MONSTER_40_SPIRIT_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_40_SPIRIT_AUDIT.md`
- Optional test: `tests/monster_40_spirit_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve phasing identity.
- Do not make it invisible or unfair.
- Counterplay: reposition before contact; doors/walls are not reliable.

## Implementation Tasks

1. Review DEF stats and sprite transparency/readability.
2. Add/sharpen local `counterplay`, `lootHint`, `floors`.
3. Record phasing AI concerns in status/log if broad.
4. Run `npm run typecheck`.

## Done Means

- Дух is distinct from Shadow.
- Phasing is communicated before it feels like a bug.
</AGENT_PROMPT>
