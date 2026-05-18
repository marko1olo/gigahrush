# FLOOR18_HELL

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Hell design floor.

<AGENT_PROMPT id="FLOOR18_HELL">
PROMPT IDENTIFIED: FLOOR18_HELL | DOMAIN: Existing floor expansion / Hell / High-threat combat | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/hell.md`.
2. Read references: `src/gen/hell/content_manifest.ts`, `src/gen/hell/index.ts`, `src/gen/hell/altar_arena.ts`, `src/gen/hell/psi_meat_cache.ts`, `src/entities/monster.ts`, `src/data/psi.ts`.
3. Create `Docs/Tasks/Status_FLOOR18_HELL.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR18_HELL.md`.
5. Run baseline `npm run build`.

## Goal

Add a Hell expansion slice that deepens high-threat combat, PSI risk and flee-or-fight decisions without infinite waves.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/hell.ts` or one new additive module under `src/gen/hell/`
- `Docs/Tasks/Status_FLOOR18_HELL.md`
- `Docs/AgentLogs/LOG_FLOOR18_HELL.md`

Allowed with caution:
- `src/gen/hell/content_manifest.ts` for one runner entry.

Forbidden:
- Do not mutate the main plot chain.
- Do not create farmable infinite spawns.
- Do not require one rare weapon as the only solution.

## Implementation Tasks

1. Add a major encounter with multiple approaches.
2. Include NPCs/traces for burned guide, cult tax, last liquidator and meat choir.
3. Add quests for altar break, extraction, PSI cache or cult signal.
4. Cap all monsters/rewards.
5. Publish event(s) for proof, ritual break or extraction outcome.
6. Run `npm run check`.

## Done Means

Hell gains a distinct high-threat decision with capped reward and a readable flee option.
</AGENT_PROMPT>

<POLISH_MANDATE>
Count maximum spawned enemies and maximum reward claims. If either is uncapped, fix it before final report.
</POLISH_MANDATE>

