# Monster_31_EYE_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing EYE ranged readability owner.

<AGENT_PROMPT id="MONSTER_31_EYE_AUDIT">
PROMPT IDENTIFIED: MONSTER_31_EYE_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/eye.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/render/sprite_index.ts`.
4. Create `Docs/Tasks/Status_MONSTER_31_EYE_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_31_EYE_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `EYE` / **Глаз** as the line-of-fire ranged enemy. It must teach breaking sightlines and closing after shots.

## Absolute Write Scope

Owned:
- `src/entities/eye.ts`
- `Docs/Tasks/Status_MONSTER_31_EYE_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_31_EYE_AUDIT.md`
- Optional test: `tests/monster_31_eye_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve role: ranged corridor breaker.
- Do not make projectile damage unreadable or unavoidable.
- Improve sprite/projectile cue only inside `eye.ts` if possible.
- Record broad projectile feedback needs in status/log, not shared render.

## Implementation Tasks

1. Review `isRanged`, projectile speed/sprite and attack rate.
2. Ensure local counterplay says break line of sight and close after shot.
3. Improve bolt sprite generation only if local and low risk.
4. Run `npm run typecheck`.

## Done Means

- Глаз explains open-corridor danger.
- Projectile/readability is better without broad combat changes.
</AGENT_PROMPT>
