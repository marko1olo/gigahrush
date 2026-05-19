# Monster_26_SBORKA_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing SBORKA readability/balance owner.

<AGENT_PROMPT id="MONSTER_26_SBORKA_AUDIT">
PROMPT IDENTIFIED: MONSTER_26_SBORKA_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source:
   - `src/entities/sborka.ts`
   - `src/entities/monster.ts`
   - `src/data/monster_ecology.ts`
   - `src/data/monster_variants.ts`
   - `src/systems/monster_bait.ts`
   - `src/systems/ai/monster.ts`
4. Create `Docs/Tasks/Status_MONSTER_26_SBORKA_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_26_SBORKA_AUDIT.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Audit and polish existing `SBORKA` / **Сборка** without changing its core role: fast, weak, panic/ammo-pressure trash that can be redirected by bait.

## Absolute Write Scope

Owned:
- `src/entities/sborka.ts`
- `Docs/Tasks/Status_MONSTER_26_SBORKA_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_26_SBORKA_AUDIT.md`
- Optional focused test: `tests/monster_26_sborka_audit.test.ts`

Read-only unless integrator explicitly reassigns:
- `src/data/monster_ecology.ts`
- `src/data/monster_variants.ts`
- `src/systems/ai/monster.ts`
- `src/systems/rpg.ts`
- floor manifests

## Audit Contract

- Preserve role: fast weak swarmlet, not a durable melee enemy.
- Check `DEF` stats and sprite readability against ecology text.
- Ensure player counterplay is visible: backpedal, wide space, bait/food/govnyak, shotgun or cheap shots.
- If shared ecology/rumor/bait changes are needed, record exact requested diff in status/log instead of editing shared files.

## Implementation Tasks

1. Read current SBORKA definition and ecology row.
2. Adjust only local entity definition/sprite if it improves readability without changing broad systems.
3. Add or sharpen `counterplay`, `floors`, or `lootHint` fields in `src/entities/sborka.ts` if missing or vague.
4. Do not increase HP enough to change its tier.
5. Run `npm run typecheck`; run `npm run check` only if you make behavior beyond entity definition.

## Done Means

- SBORKA remains cheap pressure.
- The player can understand why bait or distance works.
- No shared-file conflict is introduced.
</AGENT_PROMPT>
