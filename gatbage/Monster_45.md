# Monster_45_TUBE_EEL_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing TUBE_EEL water ambusher owner.

<AGENT_PROMPT id="MONSTER_45_TUBE_EEL_AUDIT">
PROMPT IDENTIFIED: MONSTER_45_TUBE_EEL_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/tube_eel.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/water_bridge.ts`.
4. Create `Docs/Tasks/Status_MONSTER_45_TUBE_EEL_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_45_TUBE_EEL_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `TUBE_EEL` / **Трубный угорь** as water/pipe ambusher. Dry ground should be meaningful counterplay.

## Absolute Write Scope

Owned:
- `src/entities/tube_eel.ts`
- `Docs/Tasks/Status_MONSTER_45_TUBE_EEL_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_45_TUBE_EEL_AUDIT.md`
- Optional test: `tests/monster_45_tube_eel_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve water speed advantage and dry weakness.
- Do not make it equally strong everywhere.
- Counterplay: leave water, fight from dry edge, use route/bridge.

## Implementation Tasks

1. Review local `aiFlags`, floors, stats.
2. Add/sharpen `counterplay`, `lootHint`, water identity.
3. Record if water rooms need better cues outside scope.
4. Run `npm run typecheck`.

## Done Means

- Трубный угорь changes water traversal decisions.
- No global water system changes.
</AGENT_PROMPT>
