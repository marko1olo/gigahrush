# Monster_27_TVAR_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing TVAR readability/balance owner.

<AGENT_PROMPT id="MONSTER_27_TVAR_AUDIT">
PROMPT IDENTIFIED: MONSTER_27_TVAR_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/tvar.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/systems/monster_bait.ts`.
4. Create `Docs/Tasks/Status_MONSTER_27_TVAR_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_27_TVAR_AUDIT.md`.
6. Run baseline `npm run typecheck` and record exact result.

## Goal

Audit and polish existing `TVAR` / **Тварь** as the core medium melee threat: dangerous at close range, readable at mid distance, tied to walls/panels and food distraction.

## Absolute Write Scope

Owned:
- `src/entities/tvar.ts`
- `Docs/Tasks/Status_MONSTER_27_TVAR_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_27_TVAR_AUDIT.md`
- Optional test: `tests/monster_27_tvar_audit.test.ts`

Shared files are read-only unless an integrator reassigns them.

## Audit Contract

- Preserve role: baseline melee yardstick for common expeditions.
- Do not turn it into SBORKA-fast or POLZUN-heavy.
- Improve local `counterplay`/`lootHint`/sprite cue if needed.
- Record any desired ecology/variant/rpg changes in status/log instead of editing shared tables.

## Implementation Tasks

1. Compare `tvar.ts` stats against SBORKA and POLZUN.
2. Ensure its local definition says how to beat it: hold mid-distance, avoid wall edge, bait if needed.
3. If sprite is too unclear, adjust only local sprite generator.
4. Keep player-facing text Russian.
5. Run `npm run typecheck`.

## Done Means

- TVAR remains the medium threat baseline.
- Counterplay is clearer without new AI branches.
- No shared-file conflict is introduced.
</AGENT_PROMPT>
