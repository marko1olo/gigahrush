# Monster_48_KRYSNOZHKA_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing KRYSNOZHKA food/garbage swarm owner.

<AGENT_PROMPT id="MONSTER_48_KRYSNOZHKA_AUDIT">
PROMPT IDENTIFIED: MONSTER_48_KRYSNOZHKA_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/krysnozhka.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/monster_bait.ts`, `tests/monster-bait.test.ts`.
4. Create `Docs/Tasks/Status_MONSTER_48_KRYSNOZHKA_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_48_KRYSNOZHKA_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `KRYSNOZHKA` / **Крысоножка** as low-HP food/garbage swarm pressure with bait, shotgun, trap or sealed-container counterplay.

## Absolute Write Scope

Owned:
- `src/entities/krysnozhka.ts`
- `Docs/Tasks/Status_MONSTER_48_KRYSNOZHKA_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_48_KRYSNOZHKA_AUDIT.md`
- Optional test: `tests/monster_48_krysnozhka_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve low HP and panic/placement role.
- Do not increase swarm numbers or reproduction.
- Counterplay must emphasize bait and area control.
- Bait system is read-only unless reassigned.

## Implementation Tasks

1. Review local DEF and sprite.
2. Add/sharpen `counterplay`, `floors`, `lootHint`.
3. Compare text against existing bait tests and ecology read-only.
4. Run `npm run typecheck`.

## Done Means

- Крысоножка remains capped, baitable pressure.
- No unbounded swarm logic.
</AGENT_PROMPT>
