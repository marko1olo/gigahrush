# Monster_43_LAMPOVY_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing LAMPOVY light-powered threat owner.

<AGENT_PROMPT id="MONSTER_43_LAMPOVY_AUDIT">
PROMPT IDENTIFIED: MONSTER_43_LAMPOVY_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/lampovy.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/paritel_steam_bridge.ts`.
4. Create `Docs/Tasks/Status_MONSTER_43_LAMPOVY_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_43_LAMPOVY_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `LAMPOVY` / **Ламповый** as light-fed threat. It must teach leaving lamps or breaking line/fixture context.

## Absolute Write Scope

Owned:
- `src/entities/lampovy.ts`
- `Docs/Tasks/Status_MONSTER_43_LAMPOVY_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_43_LAMPOVY_AUDIT.md`
- Optional test: `tests/monster_43_lampovy_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve lamp-powered identity.
- Do not make it just a fast melee enemy.
- Counterplay: leave lit area, lure around corner, turn off/break light only if local encounter supports it.

## Implementation Tasks

1. Review local `aiFlags`, floors, stats.
2. Add/sharpen `counterplay`, `lootHint`, light identity.
3. Record if AI light radius/readability needs integrator work.
4. Run `npm run typecheck`.

## Done Means

- Ламповый's danger depends on light context.
- Entity definition matches current AI multiplier.
</AGENT_PROMPT>
