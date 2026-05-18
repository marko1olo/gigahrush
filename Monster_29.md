# Monster_29_BETONNIK_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing BETONNIK heavy concrete threat owner.

<AGENT_PROMPT id="MONSTER_29_BETONNIK_AUDIT">
PROMPT IDENTIFIED: MONSTER_29_BETONNIK_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/betonnik.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/gen/maintenance/betonoed_shortcut.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_29_BETONNIK_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_29_BETONNIK_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `BETONNIK` / **Бетонник** as a rare, heavy concrete threat with corner/stamina/noise/fire/seal counterplay.

## Absolute Write Scope

Owned:
- `src/entities/betonnik.ts`
- `Docs/Tasks/Status_MONSTER_29_BETONNIK_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_29_BETONNIK_AUDIT.md`
- Optional test: `tests/monster_29_betonnik_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve role: rare heavy threat, not common corridor filler.
- Do not lower danger until it becomes ordinary.
- Do not make it impossible to avoid or read.
- Local text should tell players to use corners, stamina, noise/fire/seal if supported by encounter context.

## Implementation Tasks

1. Verify stats and local sprite communicate weight.
2. Add or sharpen local `counterplay`, `floors`, `lootHint`.
3. If `betonoed` variant expectations need shared table edits, record them in status/log.
4. Run `npm run typecheck`.

## Done Means

- Бетонник remains rare and memorable.
- Counterplay is concrete and not just "shoot more".
</AGENT_PROMPT>
