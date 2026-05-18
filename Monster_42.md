# Monster_42_SHOVNIK_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing SHOVNIK seam-hunter owner.

<AGENT_PROMPT id="MONSTER_42_SHOVNIK_AUDIT">
PROMPT IDENTIFIED: MONSTER_42_SHOVNIK_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/shovnik.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/systems/hermodoor_borer.ts`.
4. Create `Docs/Tasks/Status_MONSTER_42_SHOVNIK_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_42_SHOVNIK_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `SHOVNIK` / **Шовник** as seam/wall hunter. It must teach "pull into center room".

## Absolute Write Scope

Owned:
- `src/entities/shovnik.ts`
- `Docs/Tasks/Status_MONSTER_42_SHOVNIK_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_42_SHOVNIK_AUDIT.md`
- Optional test: `tests/monster_42_shovnik_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve wall/seam bias.
- Do not broaden door/borer systems.
- Counterplay: fight away from walls, center-room positioning.

## Implementation Tasks

1. Review local `aiFlags`, floors, stats.
2. Add/sharpen local `counterplay` and `lootHint`.
3. Ensure text aligns with current wall multiplier in AI.
4. Run `npm run typecheck`.

## Done Means

- Шовник's seam rule is explicit.
- It remains a clean candidate for new Plombirovshchik encounters without changing AI.
</AGENT_PROMPT>
