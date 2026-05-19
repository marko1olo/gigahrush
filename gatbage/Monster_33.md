# Monster_33_SHADOW_Audit

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: existing SHADOW ambush/darkness readability owner.

<AGENT_PROMPT id="MONSTER_33_SHADOW_AUDIT">
PROMPT IDENTIFIED: MONSTER_33_SHADOW_AUDIT | DOMAIN: Existing Monster Audit | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
3. Read source: `src/entities/shadow.ts`, `src/entities/monster.ts`, `src/entities/procedural_visuals.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
4. Create `Docs/Tasks/Status_MONSTER_33_SHADOW_AUDIT.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_33_SHADOW_AUDIT.md`.
6. Run baseline `npm run typecheck`.

## Goal

Audit and polish `SHADOW` / **Теневик** as darkness/ambush enemy that requires movement, light awareness and distance.

## Absolute Write Scope

Owned:
- `src/entities/shadow.ts`
- `Docs/Tasks/Status_MONSTER_33_SHADOW_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_33_SHADOW_AUDIT.md`
- Optional test: `tests/monster_33_shadow_audit.test.ts`

Shared files are read-only unless reassigned.

## Audit Contract

- Preserve ambush identity.
- Do not make it invisible without cue.
- Counterplay should emphasize moving after hit, keeping light/open space, not trusting dark corners.

## Implementation Tasks

1. Review local DEF stats and sprite silhouette.
2. Add/sharpen local counterplay and loot hint.
3. If darkness/lighting needs a broad hook, record blocker instead of editing render/AI.
4. Run `npm run typecheck`.

## Done Means

- Теневик is readable enough to feel fair.
- It remains distinct from Spirit and Nightmare.
</AGENT_PROMPT>
