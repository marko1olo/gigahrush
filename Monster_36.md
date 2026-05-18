# Monster_36_IDOL_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing IDOL static psi turret owner.

<AGENT_PROMPT id="MONSTER_36_IDOL_AUDIT">
PROMPT IDENTIFIED: MONSTER_36_IDOL_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/idol.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/gen/hell/choir_tax.ts`, `src/gen/design_floors/underhell.ts`.
4. Create `Docs/Tasks/Status_MONSTER_36_IDOL_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_36_IDOL_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `IDOL` / **Идол** as static ranged/psi monolith: angle, cover, or rush.

## Absolute Write Scope

Owned:
- `src/entities/idol.ts`
- `Docs/Tasks/Status_MONSTER_36_IDOL_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_36_IDOL_AUDIT.md`
- Optional test: `tests/monster_36_idol_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve immobility.
- Do not make it a mobile enemy.
- Counterplay must emphasize not standing at medium range: break angle or close.

## Implementation Tasks

1. Review DEF speed remains 0 and ranged behavior expectations.
2. Add/sharpen local `counterplay`, `floors`, `lootHint`.
3. Improve sprite silhouette only locally if needed.
4. Run `npm run typecheck`.

## Done Means

- Идол is clearly static and avoidable by geometry.
- It remains distinct from Paragraph/Eye.
</AGENT_PROMPT>
