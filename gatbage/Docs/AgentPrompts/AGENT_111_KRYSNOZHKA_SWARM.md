# AGENT_111_KRYSNOZHKA_SWARM

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: capped swarm monster variant owner.

<AGENT_PROMPT id="AGENT_111_KRYSNOZHKA_SWARM">
PROMPT IDENTIFIED: AGENT_111_KRYSNOZHKA_SWARM | DOMAIN: Monster Variant / Food-Garbage Swarm / Shotgun-Trap Counterplay | ITERATION: 3.

## Mandatory Preflight

1. Extract this XML block by id.
2. Read `README.md`, `architecture.md`, `desdoc.md` section 16.6, plus `src/entities/monster.ts`, `src/data/monster_variants.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/systems/events.ts`.
3. Create `Docs/Tasks/Status_AG111_KRYSNOZHKA.md`.
4. Append final report to `Docs/AgentLogs/LOG_AG111_KRYSNOZHKA.md`.
5. Run baseline `npm run typecheck` and record the result.

## Goal

Add a krysnozhka swarm threat attracted to food/garbage, with capped spawn count and counterplay through shotgun, trap, sealed containers or bait.

## Absolute Write Scope

Owned:
- Monster variant/entity definition
- One encounter or ecology hook
- Status/log docs

Forbidden:
- No unbounded swarm reproduction.
- No per-frame full inventory/container scan.
- No broad AI rewrite.

## Implementation Tasks

1. Decide whether krysnozhka uses existing small monster kind or needs a new sprite/kind.
2. Add capped swarm behavior: small group, short aggro, clear attack windup or movement pattern.
3. Tie attraction to explicit bait/garbage markers or generated POI, not global food scanning.
4. Add counterplay: shotgun stagger, trap, closed container, fire or bait diversion.
5. Publish events for swarm triggered, baited, dispersed and nest cleared.
6. Add one reachable encounter or debug spawn.
7. Run `npm run check`.

## Done Means

- The swarm pressures inventory/positioning.
- Spawn count and checks are capped.
- Counterplay is distinct from ordinary shooting.
</AGENT_PROMPT>

<POLISH_MANDATE>
Swarm danger should be about panic and placement, not huge numbers. Keep the cap low.
</POLISH_MANDATE>
